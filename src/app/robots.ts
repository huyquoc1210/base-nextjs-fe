import envConfig from "@/config";
import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: "*",
    allow: "/",
  },
  sitemap: `${envConfig.NEXT_PUBLIC_URL}/sitemap.xml`,
});

export default robots;
