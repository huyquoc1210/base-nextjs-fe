export const TokenType = {
  AccessToken: "AccessToken",
  RefreshToken: "RefreshToken",
  ForgotPasswordToken: "ForgotPasswordToken",
} as const;

export const Role = {
  Admin: "Admin",
  User: "User",
} as const;

export const RoleValues = [Role.Admin, Role.User] as const;

// Proxy runs server-side and cannot read localStorage, so tokens are mirrored
// into cookies for it to check
export const AuthCookie = {
  AccessToken: "accessToken",
  RefreshToken: "refreshToken",
  Locale: "NEXT_LOCALE",
} as const;
