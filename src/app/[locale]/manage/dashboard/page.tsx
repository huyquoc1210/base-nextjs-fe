import { locale as getLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

const DashboardPage = async () => {
  // Pass the locale explicitly: the request-scoped lookup counts as runtime
  // data under cacheComponents and would block prerendering
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
    </main>
  );
};

export default DashboardPage;
