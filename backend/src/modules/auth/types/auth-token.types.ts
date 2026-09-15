import type { UserRole } from "../../user/model/index.js";
import type { AUTH_TOKEN_TYPES } from "../constants/index.js";

export type AuthTokenType =
  (typeof AUTH_TOKEN_TYPES)[keyof typeof AUTH_TOKEN_TYPES];

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  branchId?: string;
  type: AuthTokenType;
  deviceId?: string;
}

export interface AuthenticatedUserLocation {
  villageId: string;
  villageName: string;
  district: string;
  pincode: string;
}

export interface AuthenticatedUserAddress {
  id?: string;
  phone?: string;
  village?: string;
  district?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  branchId?: string;
  currentLocation?: AuthenticatedUserLocation;
  address?: AuthenticatedUserAddress;
  profileImage?: string;
  isVerified: boolean;
  phoneVerified?: boolean;
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
