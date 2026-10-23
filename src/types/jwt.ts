import { Role, TokenType } from "@/constants/auth";

export type TokenTypeValue = (typeof TokenType)[keyof typeof TokenType];

export type RoleType = (typeof Role)[keyof typeof Role];

export interface TokenPayload {
  userId: number;
  role: RoleType;
  tokenType: TokenTypeValue;
  // Unix timestamps in seconds, not milliseconds
  exp: number;
  iat: number;
}
