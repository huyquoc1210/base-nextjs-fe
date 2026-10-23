import { beforeEach, describe, expect, it, vi } from "vitest";

import LocalStorage from "@/lib/local-storage";

describe("LocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("round-trips a string", () => {
    LocalStorage.set("accessToken", "abc");

    expect(LocalStorage.get<string>("accessToken")).toBe("abc");
  });

  it("round-trips an object", () => {
    LocalStorage.set("settings", { theme: "dark", count: 2 });

    expect(
      LocalStorage.get<{ theme: string; count: number }>("settings"),
    ).toEqual({
      theme: "dark",
      count: 2,
    });
  });

  it("returns the default when the key is missing", () => {
    expect(LocalStorage.get<string>("accessToken")).toBeNull();
    expect(LocalStorage.get("accessToken", "fallback")).toBe("fallback");
  });

  it("falls back instead of throwing on a value written without JSON", () => {
    // This is the trap the service exists to document: a bare setItem writes a
    // raw string that JSON.parse cannot read back.
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("accessToken", "raw-not-json");

    expect(LocalStorage.get<string>("accessToken", "fallback")).toBe(
      "fallback",
    );
  });

  it("removes a single key and leaves the others", () => {
    LocalStorage.set("accessToken", "a");
    LocalStorage.set("refreshToken", "r");

    LocalStorage.remove("accessToken");

    expect(LocalStorage.get<string>("accessToken")).toBeNull();
    expect(LocalStorage.get<string>("refreshToken")).toBe("r");
  });

  it("swallows a storage failure rather than taking down the caller", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() => LocalStorage.set("accessToken", "a")).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
