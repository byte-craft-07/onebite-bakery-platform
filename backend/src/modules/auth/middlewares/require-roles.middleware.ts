import type { RequestHandler } from "express";

import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { UserRole } from "../../user/index.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const requireRoles = (roles: readonly UserRole[]): RequestHandler => {
  return (request, _response, next) => {
    const authenticatedRequest = request as AuthenticatedRequest;

    if (!roles.includes(authenticatedRequest.user.role)) {
      return next(
        new AppError(
          "You are not allowed to perform this action.",
          HTTP_STATUS.FORBIDDEN,
          [],
          true,
          APP_ERROR_CODES.AUTHORIZATION_FAILED,
        ),
      );
    }

    return next();
  };
};
