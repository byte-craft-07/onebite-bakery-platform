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

const extractTokenFromRequest = (request: {
  cookies?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}): string | undefined => {
  const cookieToken = getCookieValue(request.cookies, AUTH_COOKIE_NAMES.ACCESS_TOKEN);
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const headerToken = authHeader.slice(7).trim();
    if (headerToken) {
      return headerToken;
    }
  }

  return undefined;
};

export const requireAuth: RequestHandler = (request, _response, next) => {
  const token = extractTokenFromRequest(request);

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
      branchId: payload.branchId,
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

export const optionalAuth: RequestHandler = (request, _response, next) => {
  const token = extractTokenFromRequest(request);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type === AUTH_TOKEN_TYPES.ACCESS) {
      (request as AuthenticatedRequest).user = {
        id: payload.sub,
        name: "",
        phone: "",
        role: payload.role,
        branchId: payload.branchId,
        isVerified: true,
      };
      (request as AuthenticatedRequest).accessToken = token;
    }
  } catch {
    // Ignore error for optional authentication and continue anonymously
  }

  return next();
};
