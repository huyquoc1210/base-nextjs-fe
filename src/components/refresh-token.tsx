"use client";

import { useAppStore } from "@/components/app-provider";
import Paths from "@/constants/paths";
import { usePathname, useRouter } from "@/i18n/navigation";
import { checkAndRefreshToken } from "@/lib/auth-refresh";
import { useEffect } from "react";

// Pages that run without a session; refreshing there would bounce the user
const UNAUTHENTICATED_PATHS: string[] = [
  Paths.auth.login.index,
  Paths.auth.logout.index,
  Paths.auth.refreshToken.index,
];

// Must stay well below the access token lifetime so the token is replaced
// before it expires rather than after a request already failed
const CHECK_INTERVAL_MS = 1000;

const RefreshToken = () => {
  // #region State
  const pathname = usePathname();
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);
  // #endregion

  // #region Effects
  useEffect(() => {
    if (UNAUTHENTICATED_PATHS.includes(pathname)) return;

    // Held in an object so the first run, which happens before the interval
    // exists, can still stop it from its async error callback
    const timer: { id?: ReturnType<typeof setInterval> } = {};

    const handleRefreshToken = () => {
      checkAndRefreshToken({
        onError: () => {
          clearInterval(timer.id);
          setRole();
          router.push(Paths.auth.login.index);
        },
      });
    };

    // Run once up front, the interval only fires after the first delay
    handleRefreshToken();

    timer.id = setInterval(handleRefreshToken, CHECK_INTERVAL_MS);

    return () => clearInterval(timer.id);
  }, [pathname, router, setRole]);
  // #endregion

  return null;
};

export default RefreshToken;
