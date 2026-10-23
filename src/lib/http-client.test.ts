import { beforeEach, describe, expect, it, vi } from "vitest";

import HttpClient from "@/lib/http-client";
import { EntityError, HttpError } from "@/lib/http-error";
import LocalStorage from "@/lib/local-storage";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const envelope = <T>(data: T) => ({
  data,
  metadata: {},
  message: null,
  messageCode: null,
  statusCode: 200,
});

describe("HttpClient", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns the whole envelope, not just data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(200, { ...envelope({ id: 1 }), metadata: { total: 42 } }),
    );

    const response = await HttpClient.get<{ id: number }>("users");

    expect(response.data).toEqual({ id: 1 });
    expect(response.metadata).toEqual({ total: 42 });
  });

  it("treats 204 as success with null data rather than throwing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const response = await HttpClient.delete("users/1");

    expect(response.data).toBeNull();
    expect(response.statusCode).toBe(204);
  });

  it("throws EntityError with field errors on 422", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(422, {
        data: [{ field: "email", message: "Email is invalid" }],
        metadata: {},
        message: "Validation failed",
        messageCode: null,
        statusCode: 422,
      }),
    );

    const error = await HttpClient.post("users", {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EntityError);
    expect((error as EntityError).status).toBe(422);
    expect((error as EntityError).fieldErrors).toEqual([
      { field: "email", message: "Email is invalid" },
    ]);
  });

  it("wraps a network failure instead of losing it", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    const error = await HttpClient.get("users").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(0);
    expect((error as HttpError).message).toBe("Failed to fetch");
  });

  it("attaches the access token from storage", async () => {
    LocalStorage.set("accessToken", "token-123");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, envelope(null)));

    await HttpClient.get("users");

    const headers = (fetchSpy.mock.calls[0][1]?.headers ?? {}) as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe("Bearer token-123");
  });

  it("sends no Authorization header without a token", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, envelope(null)));

    await HttpClient.get("users");

    const headers = (fetchSpy.mock.calls[0][1]?.headers ?? {}) as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBeUndefined();
  });

  it("leaves Content-Type unset for FormData so the boundary survives", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, envelope(null)));

    await HttpClient.post("upload", new FormData());

    const headers = (fetchSpy.mock.calls[0][1]?.headers ?? {}) as Record<
      string,
      string
    >;
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("joins baseUrl and path without doubling slashes", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(200, envelope(null)));

    await HttpClient.get("/users/", { baseUrl: "https://api.test/" });

    expect(fetchSpy.mock.calls[0][0]).toBe("https://api.test/users");
  });

  it("refreshes once then retries the original request on 401", async () => {
    LocalStorage.set("accessToken", "stale");
    LocalStorage.set("refreshToken", "valid");

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(401, { message: "Unauthorized" }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { accessToken: "new", refreshToken: "new-r" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, envelope({ secret: "ok" })));

    const response = await HttpClient.get<{ secret: string }>("protected");

    expect(response.data).toEqual({ secret: "ok" });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls[1][0]).toBe("/api/auth/refresh-token");
    expect(LocalStorage.get<string>("accessToken")).toBe("new");
  });

  it("throws 401 without retrying when the refresh fails", async () => {
    LocalStorage.set("accessToken", "stale");
    LocalStorage.set("refreshToken", "dead");

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(401, { message: "Unauthorized" }))
      .mockResolvedValueOnce(jsonResponse(401, { message: "Refresh failed" }));

    const error = await HttpClient.get("protected").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(401);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(LocalStorage.get<string>("accessToken")).toBeNull();
  });
});
