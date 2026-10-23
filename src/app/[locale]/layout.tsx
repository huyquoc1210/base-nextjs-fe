import AppProvider from "@/components/app-provider";
import ThemeProvider from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { locale as getLocale } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { FCC } from "@/types/react";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return { title: t("title"), description: t("description") };
};

// cacheComponents requires every root param to have at least one value,
// otherwise the build fails
export const generateStaticParams = () =>
  routing.locales.map((locale) => ({ locale }));

const RootLayout: FCC = async (props) => {
  const { children } = props;

  // Read through root-params rather than awaiting `params`, which counts as
  // runtime data under cacheComponents and blocks prerendering
  const locale = await getLocale();

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Opts the route into static rendering; without it next-intl reads the
  // request headers and cacheComponents refuses to prerender
  setRequestLocale(locale);

  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html>
    // client-side, so server and client markup differ on first render
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppProvider>{children}</AppProvider>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
