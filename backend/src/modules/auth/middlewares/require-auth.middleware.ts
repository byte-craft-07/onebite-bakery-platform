import type { RequestHandler } from "express";

import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { AUTH_COOKIE_NAMES, AUTH_RESPONSE_MESSAGES, AUTH_TOKEN_TYPES } from "../constants/index.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { verifyAccessToken } from "../utils/index.js";

const getCookieValue = (cookies: unknown, name: string): string | undefined => {
  if (!cookies || typeof cookies !== "object") {
    return undefined;
  }

  const value = (cookies as Record<string, unknown>)[name];

  return typeof value === "string" ? value : undefined;
};

export const requireAuth: RequestHandler = (request, _response, next) => {
  const token = getCookieValue(request.cookies, AUTH_COOKIE_NAMES.ACCESS_TOKEN);

  if (!token) {
    return next(
      new AppError(
        AUTH_RESPONSE_MESSAGES.AUTHENTICATION_REQUIRED,
        HTTP_STATUS.UNAUTHORIZED,
        [],
        true,
        APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
      ),
    );
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== AUTH_TOKEN_TYPES.ACCESS) {
      throw new Error("Invalid access token type.");
    }

    (request as AuthenticatedRequest).user = {
      id: payload.sub,
      name: "",
      phone: "",
      role: payload.role,
      isVerified: true,
    };
    (request as AuthenticatedRequest).accessToken = token;

    return next();
  } catch {
    return next(
      new AppError(
        AUTH_RESPONSE_MESSAGES.AUTHENTICATION_REQUIRED,
        HTTP_STATUS.UNAUTHORIZED,
        [],
        true,
        APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
      ),
    );
  }
};
