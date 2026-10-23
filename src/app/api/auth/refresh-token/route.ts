import authApi from "@/apis/auth";
import { AuthCookie } from "@/constants/auth";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookie";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(AuthCookie.RefreshToken)?.value;

  if (!refreshToken) {
    return Response.json({ message: "No refresh token" }, { status: 401 });
  }

  try {
    const response = await authApi.serverRefresh({ refreshToken });
    await setAuthCookies(response.data);

    return Response.json(response);
  } catch {
    // The cookies have to go too. Leaving them behind would let the proxy
    // keep treating the request as signed in while the client has already
    // cleared its own tokens, bouncing the user between login and the app.
    await clearAuthCookies();

    // Any failure here means the session is gone, so the client always sees
    // a 401 and never has to guess at the reason
    return Response.json({ message: "Refresh failed" }, { status: 401 });
  }
}
