import type { UserRole } from "../../user/model/index.js";
import type { AUTH_TOKEN_TYPES } from "../constants/index.js";

export type AuthTokenType =
  (typeof AUTH_TOKEN_TYPES)[keyof typeof AUTH_TOKEN_TYPES];

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  type: AuthTokenType;
  deviceId?: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  isVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenMaxAgeMs: number;
  refreshTokenMaxAgeMs: number;
}

export interface AuthenticationResult {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
