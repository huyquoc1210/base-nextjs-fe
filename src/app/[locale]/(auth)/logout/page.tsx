import Logout from "@/app/[locale]/(auth)/logout/logout";
import type { Metadata } from "next";
import { locale as getLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Logout" });

  return { title: t("title"), robots: { index: false } };
};

const LogoutPage = () => (
  <Suspense>
    <Logout />
  </Suspense>
);

export default LogoutPage;
