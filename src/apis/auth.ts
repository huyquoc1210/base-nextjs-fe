import Endpoints from "@/constants/endpoints";
import HttpClient from "@/lib/http-client";
import LocalStorage from "@/lib/local-storage";
import type { AuthTokens, LoginBody } from "@/schemas/auth";
import type { HttpResponse } from "@/types/http";

// Calls the Next.js route handler rather than the backend directly, so the
// server can write the httpOnly cookies the proxy reads
const sameOrigin = { baseUrl: "" } as const;

const authApi = {
  login: async (body: LoginBody): Promise<HttpResponse<AuthTokens>> => {
    const response = await HttpClient.post<AuthTokens>(
      "api/auth/login",
      body,
      sameOrigin,
    );

    LocalStorage.set("accessToken", response.data.accessToken);
    LocalStorage.set("refreshToken", response.data.refreshToken);

    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await HttpClient.post("api/auth/logout", undefined, sameOrigin);
    } finally {
      LocalStorage.remove("accessToken");
      LocalStorage.remove("refreshToken");
    }
  },

  // Mirrors tokens into cookies after the http client rotated them client-side
  syncTokens: (tokens: AuthTokens) =>
    HttpClient.post<AuthTokens>("api/auth/token", tokens, sameOrigin),

  serverLogin: (body: LoginBody) =>
    HttpClient.post<AuthTokens>(Endpoints.auth.login, body),

  serverLogout: (tokens: AuthTokens) =>
    HttpClient.post(Endpoints.auth.logout, tokens),

  serverRefresh: (body: { refreshToken: string }) =>
    HttpClient.post<AuthTokens>(Endpoints.auth.refresh, body),
};

export default authApi;
