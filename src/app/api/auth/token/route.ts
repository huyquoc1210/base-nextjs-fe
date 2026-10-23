import { setAuthCookies } from "@/lib/auth-cookie";
import { authTokensSchema } from "@/schemas/auth";

export async function POST(request: Request) {
  const parsed = authTokensSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json({ message: "Invalid tokens" }, { status: 422 });
  }

  await setAuthCookies(parsed.data);

  return Response.json(parsed.data);
}
