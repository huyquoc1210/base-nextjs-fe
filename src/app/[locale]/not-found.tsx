import Paths from "@/constants/paths";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { locale as getLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

const NotFound = async () => {
  // Pass the locale explicitly: the request-scoped lookup counts as runtime
  // data under cacheComponents and would block prerendering
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "NotFound" });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button render={<Link href={Paths.index} />}>{t("backHome")}</Button>
    </main>
  );
};

export default NotFound;
