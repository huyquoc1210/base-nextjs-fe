import { AuthCookie } from "@/constants/auth";
import { decodeToken } from "@/lib/utils";
import type { AuthTokens } from "@/schemas/auth";
import { cookies } from "next/headers";

const BASE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;

export const setAuthCookies = async (tokens: AuthTokens): Promise<void> => {
  const store = await cookies();

  // exp is in seconds, the cookie API wants milliseconds
  store.set(AuthCookie.AccessToken, tokens.accessToken, {
    ...BASE_OPTIONS,
    expires: decodeToken(tokens.accessToken).exp * 1000,
  });

  store.set(AuthCookie.RefreshToken, tokens.refreshToken, {
    ...BASE_OPTIONS,
    expires: decodeToken(tokens.refreshToken).exp * 1000,
  });
};

export const clearAuthCookies = async (): Promise<void> => {
  const store = await cookies();

  store.delete(AuthCookie.AccessToken);
  store.delete(AuthCookie.RefreshToken);
};
