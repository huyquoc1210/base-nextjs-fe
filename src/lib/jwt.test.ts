import { describe, expect, it } from "vitest";

import { decodeToken, isExpired } from "@/lib/jwt";

const encode = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeToken = (payload: object) =>
  `${encode({ alg: "HS256" })}.${encode(payload)}.stub`;

describe("decodeToken", () => {
  it("reads the payload", () => {
    const token = makeToken({ userId: 7, role: "Admin", exp: 100, iat: 50 });

    expect(decodeToken(token)).toMatchObject({ userId: 7, role: "Admin" });
  });

  it("throws on a malformed token so callers must handle it", () => {
    expect(() => decodeToken("not-a-jwt")).toThrow();
  });
});

describe("isExpired", () => {
  const nowSeconds = Math.floor(Date.now() / 1000);

  it("is false while the token is still valid", () => {
    expect(isExpired(makeToken({ exp: nowSeconds + 60 }))).toBe(false);
  });

  it("is true once the expiry has passed", () => {
    expect(isExpired(makeToken({ exp: nowSeconds - 60 }))).toBe(true);
  });

  it("treats an undecodable token as expired", () => {
    expect(isExpired("not-a-jwt")).toBe(true);
  });
});
