import { z } from "zod";

// NOTE: The messages are keys in the ErrorMessage namespace, not sentences.
// Components translate them; see translateError in the login form.
export const loginBodySchema = z.object({
  email: z.email("invalidEmail"),
  password: z.string().min(6, "passwordTooShort"),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
