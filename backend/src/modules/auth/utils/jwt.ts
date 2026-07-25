import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

import { env } from "../../../config/env.js";
import { AUTH_TOKEN_TYPES } from "../constants/index.js";
import type { AuthTokenPayload, AuthTokens } from "../types/index.js";
import { durationToMs, durationToSeconds } from "./token-expiry.js";

interface TokenSubject {
  userId: string;
  role: AuthTokenPayload["role"];
  deviceId: string;
}

export const generateDeviceId = (): string => {
  return randomUUID();
};

export const generateAuthTokens = (subject: TokenSubject): AuthTokens => {
  const accessPayload: AuthTokenPayload = {
    sub: subject.userId,
    role: subject.role,
    type: AUTH_TOKEN_TYPES.ACCESS,
  };

  const refreshPayload: AuthTokenPayload = {
    sub: subject.userId,
    role: subject.role,
    type: AUTH_TOKEN_TYPES.REFRESH,
    deviceId: subject.deviceId,
  };

  const accessToken = jwt.sign(accessPayload, env.jwtSecret, {
    expiresIn: durationToSeconds(env.accessTokenExpires),
  });

  const refreshToken = jwt.sign(refreshPayload, env.jwtRefreshSecret, {
    expiresIn: durationToSeconds(env.refreshTokenExpires),
    jwtid: randomUUID(),
  });

  return {
    accessToken,
    refreshToken,
    accessTokenMaxAgeMs: durationToMs(env.accessTokenExpires),
    refreshTokenMaxAgeMs: durationToMs(env.refreshTokenExpires),
  };
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  const payload = jwt.verify(token, env.jwtSecret);

  return parseAuthTokenPayload(payload, AUTH_TOKEN_TYPES.ACCESS);
};

export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  const payload = jwt.verify(token, env.jwtRefreshSecret);

  return parseAuthTokenPayload(payload, AUTH_TOKEN_TYPES.REFRESH);
};

const parseAuthTokenPayload = (
  payload: string | jwt.JwtPayload,
  expectedType: AuthTokenPayload["type"],
): AuthTokenPayload => {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    (payload.role !== "customer" && payload.role !== "admin") ||
    payload.type !== expectedType
  ) {
    throw new Error("Invalid token payload.");
  }

  const deviceId =
    typeof payload.deviceId === "string" ? payload.deviceId : undefined;

  return {
    sub: payload.sub,
    role: payload.role,
    type: payload.type,
    ...(deviceId ? { deviceId } : {}),
  };
};
