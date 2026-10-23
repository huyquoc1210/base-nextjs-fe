import RefreshToken from "@/app/[locale]/(auth)/refresh-token/refresh-token";
import type { Metadata } from "next";
import { locale as getLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "RefreshToken" });

  return { title: t("title"), robots: { index: false } };
};

const RefreshTokenPage = () => (
  <Suspense>
    <RefreshToken />
  </Suspense>
);

export default RefreshTokenPage;
