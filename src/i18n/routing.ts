import { defaultLocale, locales } from "@/config";
import { defineRouting } from "next-intl/routing";

// Keep this file free of createNavigation: proxy.ts imports it, and the
// navigation helpers pull in server-only config that middleware cannot load
export const routing = defineRouting({
  locales,
  defaultLocale,
});
