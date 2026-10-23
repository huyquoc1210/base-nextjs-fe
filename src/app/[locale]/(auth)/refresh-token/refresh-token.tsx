"use client";

import authApi from "@/apis/auth";
import Paths from "@/constants/paths";
import { useRouter } from "@/i18n/navigation";
import { checkAndRefreshToken } from "@/lib/auth-refresh";
import LocalStorage from "@/lib/local-storage";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const RefreshToken = () => {
  // #region State
  const t = useTranslations("RefreshToken");

  const router = useRouter();
  const searchParams = useSearchParams();

  const hasRun = useRef(false);
  // #endregion

  // #region Derived
  const refreshTokenFromUrl = searchParams.get("refreshToken");
  const redirectPathname = searchParams.get("redirect");
  // #endregion

  // #region Effects
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // The proxy sends users here off the cookie alone. Ending the session has
    // to clear the cookie too, otherwise the proxy keeps routing back here and
    // the user is stuck in a loop between this page and the app.
    const endSession = async () => {
      await authApi.logout();
      router.push(Paths.auth.login.index);
    };

    // Only act on a token this browser already holds, so the page cannot be
    // driven with someone else's token from a crafted link
    if (
      !refreshTokenFromUrl ||
      refreshTokenFromUrl !== LocalStorage.get<string>("refreshToken")
    ) {
      void endSession();
      return;
    }

    void checkAndRefreshToken({
      force: true,
      onSuccess: () => router.push(redirectPathname ?? Paths.index),
      onError: endSession,
    });
  }, [router, refreshTokenFromUrl, redirectPathname]);
  // #endregion

  return <p className="text-sm text-muted-foreground">{t("refreshing")}</p>;
};

export default RefreshToken;
