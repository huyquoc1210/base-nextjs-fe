import { defaultLocale } from "@/config";
import { AUTH_FLOW_PATHS, PUBLIC_PATHS, ROUTE_ROLES } from "@/constants/access";
import { AuthCookie } from "@/constants/auth";
import Paths from "@/constants/paths";
import { routing } from "@/i18n/routing";
import { decodeToken } from "@/lib/jwt";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const handleI18nRouting = createMiddleware(routing);

const knownLocales: readonly string[] = routing.locales;

const splitLocale = (pathname: string) => {
  const [, maybeLocale, ...rest] = pathname.split("/");

  if (!knownLocales.includes(maybeLocale)) {
    return { locale: null, path: pathname };
  }

  return { locale: maybeLocale, path: `/${rest.join("/")}` };
};

const matches = (path: string, candidates: string[]): boolean =>
  candidates.some(
    (candidate) => path === candidate || path.startsWith(`${candidate}/`),
  );

const isAllowedForRole = (path: string, refreshToken: string): boolean => {
  const rule = ROUTE_ROLES.find((entry) => matches(path, [entry.path]));

  if (!rule) return true;

  try {
    return rule.roles.includes(decodeToken(refreshToken).role);
  } catch {
    return false;
  }
};

export function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  const { locale, path } = splitLocale(request.nextUrl.pathname);
  const activeLocale =
    locale ?? request.cookies.get(AuthCookie.Locale)?.value ?? defaultLocale;

  const localized = (target: string) =>
    new URL(`/${activeLocale}${target}`, request.url);

  // The refresh token outlives the access token, so it decides whether a
  // session exists at all
  const refreshToken = request.cookies.get(AuthCookie.RefreshToken)?.value;
  const accessToken = request.cookies.get(AuthCookie.AccessToken)?.value;

  // These pages drive the token flow themselves
  if (matches(path, AUTH_FLOW_PATHS)) return response;

  if (!refreshToken) {
    if (matches(path, PUBLIC_PATHS)) return response;

    return NextResponse.redirect(localized(Paths.auth.login.index));
  }

  if (matches(path, PUBLIC_PATHS)) {
    return NextResponse.redirect(localized(Paths.index));
  }

  // Session is alive but the access token cookie expired, which happens after
  // being away long enough. Hand off to the client page that refreshes and
  // sends the user back where they were headed.
  if (!accessToken) {
    const target = localized(Paths.auth.refreshToken.index);
    target.searchParams.set("refreshToken", refreshToken);
    target.searchParams.set("redirect", path);

    return NextResponse.redirect(target);
  }

  if (!isAllowedForRole(path, refreshToken)) {
    return NextResponse.redirect(localized(Paths.index));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
