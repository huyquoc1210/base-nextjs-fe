import authApi from "@/apis/auth";
import { setAuthCookies } from "@/lib/auth-cookie";
import { HttpError } from "@/lib/http-error";
import { loginBodySchema } from "@/schemas/auth";

export async function POST(request: Request) {
  const parsed = loginBodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { message: "Invalid request body", data: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const response = await authApi.serverLogin(parsed.data);
    await setAuthCookies(response.data);

    return Response.json(response);
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(error.payload, { status: error.status });
    }

    return Response.json({ message: "Login failed" }, { status: 500 });
  }
}
