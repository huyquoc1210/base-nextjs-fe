import envConfig, { locales } from "@/config";
import Paths from "@/constants/paths";
import type { MetadataRoute } from "next";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: "", changeFrequency: "daily", priority: 1 },
  { url: Paths.auth.login.index, changeFrequency: "yearly", priority: 0.5 },
];

const sitemap = (): MetadataRoute.Sitemap =>
  locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      ...route,
      url: `${envConfig.NEXT_PUBLIC_URL}/${locale}${route.url}`,
      lastModified: new Date(),
    })),
  );

export default sitemap;
