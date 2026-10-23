"use server";

import type { Locale } from "@/config";
import { defaultLocale } from "@/config";
import { AuthCookie } from "@/constants/auth";
import { cookies } from "next/headers";

export const getUserLocale = async (): Promise<string> => {
  const store = await cookies();

  return store.get(AuthCookie.Locale)?.value ?? defaultLocale;
};

export const setUserLocale = async (locale: Locale): Promise<void> => {
  const store = await cookies();

  store.set(AuthCookie.Locale, locale);
};
