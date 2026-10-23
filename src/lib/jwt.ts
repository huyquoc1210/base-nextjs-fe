import { jwtDecode } from "jwt-decode";
import type { TokenPayload } from "@/types/jwt";

// NOTE: Decodes only, does not verify the signature. Never gate anything
// security-relevant on this result.
export const decodeToken = (token: string): TokenPayload =>
  jwtDecode<TokenPayload>(token);

export const isExpired = (token: string): boolean => {
  try {
    return decodeToken(token).exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};
