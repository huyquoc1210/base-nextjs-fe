"use client";

import { useAppStore } from "@/components/app-provider";
import Paths from "@/constants/paths";
import { useRouter } from "@/i18n/navigation";
import LocalStorage from "@/lib/local-storage";
import { useLogoutMutation } from "@/queries/useAuth";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const Logout = () => {
  // #region State
  const t = useTranslations("Logout");

  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);
  const searchParams = useSearchParams();

  // Strict Mode mounts twice in dev and the effect reruns on param changes,
  // so without this the logout request fires more than once
  const hasRun = useRef(false);
  // #endregion

  // #region Queries
  const { mutateAsync } = useLogoutMutation();
  // #endregion

  // #region Derived
  const refreshTokenFromUrl = searchParams.get("refreshToken");
  const accessTokenFromUrl = searchParams.get("accessToken");
  // #endregion

  // #region Effects
  useEffect(() => {
    if (hasRun.current) return;

    // Only log out for a token this browser holds, so a crafted link cannot
    // sign someone out
    const matchesStoredToken =
      (refreshTokenFromUrl &&
        refreshTokenFromUrl === LocalStorage.get<string>("refreshToken")) ||
      (accessTokenFromUrl &&
        accessTokenFromUrl === LocalStorage.get<string>("accessToken"));

    if (!matchesStoredToken) {
      router.push(Paths.index);
      return;
    }

    hasRun.current = true;

    mutateAsync()
      .catch(() => {
        // Tokens are cleared either way, nothing left to recover
      })
      .finally(() => {
        setRole();
        router.push(Paths.auth.login.index);
      });
  }, [mutateAsync, router, setRole, refreshTokenFromUrl, accessTokenFromUrl]);
  // #endregion

  return <p className="text-sm text-muted-foreground">{t("signingOut")}</p>;
};

export default Logout;
