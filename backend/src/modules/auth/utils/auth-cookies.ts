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

const createGoogleOAuthStateCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
  path: `${env.apiPrefix}/auth/google`,
});

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

const createCookieClearOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  path: "/",
});

export const clearAuthCookies = (response: Response): void => {
  const options = createCookieClearOptions();
  response.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, options);
  response.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, options);
};

export const setGoogleOAuthStateCookie = (
  response: Response,
  state: string,
): void => {
  response.cookie(
    AUTH_COOKIE_NAMES.GOOGLE_OAUTH_STATE,
    state,
    createGoogleOAuthStateCookieOptions(),
  );
};

export const clearGoogleOAuthStateCookie = (response: Response): void => {
  response.clearCookie(
    AUTH_COOKIE_NAMES.GOOGLE_OAUTH_STATE,
    createGoogleOAuthStateCookieOptions(),
  );
};
