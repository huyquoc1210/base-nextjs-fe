import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkAndRefreshToken, refreshTokens } from "@/lib/auth-refresh";
import LocalStorage from "@/lib/local-storage";

const SECOND = 1000;

const makeToken = (issuedSecondsAgo: number, lifetimeSeconds: number) => {
  const iat = Math.floor(Date.now() / SECOND) - issuedSecondsAgo;
  const payload = {
    userId: 1,
    role: "Admin",
    tokenType: "AccessToken",
    iat,
    exp: iat + lifetimeSeconds,
  };
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${encode({ alg: "HS256" })}.${encode(payload)}.stub`;
};

const storeTokens = (accessToken: string, refreshToken: string) => {
  LocalStorage.set("accessToken", accessToken);
  LocalStorage.set("refreshToken", refreshToken);
};

const okResponse = () =>
  new Response(
    JSON.stringify({
      data: { accessToken: "fresh-access", refreshToken: "fresh-refresh" },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

const unauthorizedResponse = () => new Response("{}", { status: 401 });

describe("checkAndRefreshToken", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does nothing when there is no session", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await checkAndRefreshToken();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("leaves a fresh access token alone", async () => {
    // 1 second into a 30 second lifetime: far above the one-third threshold
    storeTokens(makeToken(1, 30), makeToken(1, 3600));
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await checkAndRefreshToken();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refreshes once the access token drops below a third of its life", async () => {
    // 25 seconds into 30: only 5 left, below the 10 second threshold
    storeTokens(makeToken(25, 30), makeToken(1, 3600));
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(okResponse());

    const onSuccess = vi.fn();
    await checkAndRefreshToken({ onSuccess });

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0][0]).toBe("/api/auth/refresh-token");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(LocalStorage.get<string>("accessToken")).toBe("fresh-access");
  });

  it("refreshes a still-fresh token when force is set", async () => {
    storeTokens(makeToken(1, 30), makeToken(1, 3600));
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(okResponse());

    await checkAndRefreshToken({ force: true });

    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("gives up and clears the session when the refresh token has expired", async () => {
    storeTokens(makeToken(25, 30), makeToken(7200, 3600));
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const onError = vi.fn();

    await checkAndRefreshToken({ onError });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(LocalStorage.get<string>("accessToken")).toBeNull();
    expect(LocalStorage.get<string>("refreshToken")).toBeNull();
  });

  it("treats a malformed token as no session instead of throwing", async () => {
    storeTokens("not-a-jwt", "also-not-a-jwt");
    const onError = vi.fn();

    await expect(checkAndRefreshToken({ onError })).resolves.toBeUndefined();

    expect(onError).toHaveBeenCalledOnce();
    expect(LocalStorage.get<string>("accessToken")).toBeNull();
  });

  it("clears the session and reports failure when refresh is rejected", async () => {
    storeTokens(makeToken(25, 30), makeToken(1, 3600));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(unauthorizedResponse());
    const onError = vi.fn();

    await checkAndRefreshToken({ onError });

    expect(onError).toHaveBeenCalledOnce();
    expect(LocalStorage.get<string>("accessToken")).toBeNull();
    expect(LocalStorage.get<string>("refreshToken")).toBeNull();
  });
});

describe("refreshTokens single-flight", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("issues one request for concurrent callers", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockReturnValue(pending);

    const calls = [refreshTokens(), refreshTokens(), refreshTokens()];
    resolveFetch(okResponse());
    const results = await Promise.all(calls);

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(results.every((r) => r?.accessToken === "fresh-access")).toBe(true);
  });

  it("allows a new request once the previous one settled", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(okResponse());

    await refreshTokens();
    await refreshTokens();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
