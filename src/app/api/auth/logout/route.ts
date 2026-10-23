import authApi from "@/apis/auth";
import { AuthCookie } from "@/constants/auth";
import { clearAuthCookies } from "@/lib/auth-cookie";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  const accessToken = store.get(AuthCookie.AccessToken)?.value;
  const refreshToken = store.get(AuthCookie.RefreshToken)?.value;

  await clearAuthCookies();

  // Keyed off the refresh token alone: an expired access token must not stop
  // the backend from revoking the session. Logging out always succeeds
  // locally, so a failing backend call cannot strand the user signed in.
  if (refreshToken) {
    try {
      await authApi.serverLogout({
        accessToken: accessToken ?? "",
        refreshToken,
      });
    } catch {
      // Cookies are already cleared, nothing left to recover
    }
  }

  return Response.json({ message: "Logged out" });
}
