import { decodeToken } from "@/lib/jwt";
import LocalStorage from "@/lib/local-storage";
import type { AuthTokens } from "@/schemas/auth";

type CheckOptions = {
  onSuccess?: (tokens: AuthTokens) => void;
  onError?: () => void;
  // Refresh even when the access token still has life left in it
  force?: boolean;
};

// Refresh once the access token has burned through two thirds of its life
const REFRESH_AT_REMAINING_RATIO = 1 / 3;

// Module scope on purpose: every caller shares one in-flight request, so a
// burst of 401s and the interval tick cannot refresh twice
let refreshRequest: Promise<AuthTokens | null> | null = null;

const clearTokens = () => {
  LocalStorage.remove("accessToken");
  LocalStorage.remove("refreshToken");
};

const sendRefresh = async (): Promise<AuthTokens | null> => {
  try {
    // Goes through the route handler rather than the backend so the httpOnly
    // cookies the proxy reads are rewritten in the same step
    const response = await fetch("/api/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const body = (await response.json()) as { data: AuthTokens };

    LocalStorage.set("accessToken", body.data.accessToken);
    LocalStorage.set("refreshToken", body.data.refreshToken);

    return body.data;
  } catch {
    clearTokens();
    return null;
  }
};

export const refreshTokens = (): Promise<AuthTokens | null> => {
  refreshRequest ??= sendRefresh().finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
};

export const checkAndRefreshToken = async (options: CheckOptions = {}) => {
  const { onSuccess, onError, force } = options;

  const accessToken = LocalStorage.get<string>("accessToken");
  const refreshToken = LocalStorage.get<string>("refreshToken");

  if (!accessToken || !refreshToken) return;

  let decodedAccess;
  let decodedRefresh;

  try {
    decodedAccess = decodeToken(accessToken);
    decodedRefresh = decodeToken(refreshToken);
  } catch {
    // Malformed token in storage, treat it as no session at all
    clearTokens();
    onError?.();
    return;
  }

  const now = Date.now();

  // Nothing to refresh with any more
  if (decodedRefresh.exp * 1000 <= now) {
    clearTokens();
    onError?.();
    return;
  }

  const lifetime = (decodedAccess.exp - decodedAccess.iat) * 1000;
  const remaining = decodedAccess.exp * 1000 - now;

  if (!force && remaining > lifetime * REFRESH_AT_REMAINING_RATIO) return;

  const tokens = await refreshTokens();

  if (tokens) {
    onSuccess?.(tokens);
    return;
  }

  onError?.();
};
