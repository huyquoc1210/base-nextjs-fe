import { z } from "zod";

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string(),
  NEXT_PUBLIC_URL: z.string(),
  // NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string(),
  // NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI: z.string(),
});

// NOTE: Each variable has to be spelled out. Next.js inlines
// `process.env.NEXT_PUBLIC_*` per reference at build time, so `process.env`
// is not a complete object on the client and spreading it yields nothing.
const parsedConfig = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  // NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  // NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI:
  //   process.env.NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI,
});

// Fail at module load rather than letting the app run and break later at
// scattered call sites
if (!parsedConfig.success) {
  console.error(parsedConfig.error.issues);
  throw new Error("Invalid environment variables");
}

const envConfig = parsedConfig.data;

export const locales = ["en", "vi"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export default envConfig;
