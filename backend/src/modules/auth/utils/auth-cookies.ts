import type { CookieOptions, Response } from "express";

import { env } from "../../../config/env.js";
import { AUTH_COOKIE_NAMES } from "../constants/index.js";
import type { AuthTokens } from "../types/index.js";

const createCookieOptions = (maxAge: number): CookieOptions => {
  return {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  };
};

export const setAuthCookies = (
  response: Response,
  tokens: AuthTokens,
): void => {
  response.cookie(
    AUTH_COOKIE_NAMES.ACCESS_TOKEN,
    tokens.accessToken,
    createCookieOptions(tokens.accessTokenMaxAgeMs),
  );
  response.cookie(
    AUTH_COOKIE_NAMES.REFRESH_TOKEN,
    tokens.refreshToken,
    createCookieOptions(tokens.refreshTokenMaxAgeMs),
  );
};

export const clearAuthCookies = (response: Response): void => {
  response.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, { path: "/" });
  response.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, { path: "/" });
};
