import { Role } from "@/constants/auth";
import Paths from "@/constants/paths";
import type { RoleType } from "@/types/jwt";

// Routes that are reachable without a session. Everything else needs one.
export const PUBLIC_PATHS: string[] = [
  Paths.auth.login.index,
  Paths.auth.register.index,
];

// Pages that run their own token handling, so the proxy must not bounce them
// back into the refresh flow
export const AUTH_FLOW_PATHS: string[] = [
  Paths.auth.logout.index,
  Paths.auth.refreshToken.index,
];

// Fill this in per project. A path not listed here is open to any signed-in
// role; the first matching entry wins.
export const ROUTE_ROLES: { path: string; roles: readonly RoleType[] }[] = [
  { path: Paths.user.index, roles: [Role.Admin] },
];
