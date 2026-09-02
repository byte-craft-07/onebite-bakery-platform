import type { Request, RequestHandler } from "express";

import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { AuthenticatedRequest } from "../types/index.js";

/**
 * Middleware ensuring the authenticated user has Central Admin privileges.
 */
export const requireCentralAdmin: RequestHandler = (request, _response, next) => {
  const authenticatedRequest = request as AuthenticatedRequest;

  if (authenticatedRequest.user.role !== "admin") {
    return next(
      new AppError(
        "Central Admin access required for this operation.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      ),
    );
  }

  return next();
};

/**
 * Middleware ensuring the authenticated user has at least Branch Admin privileges.
 */
export const requireBranchAdmin: RequestHandler = (request, _response, next) => {
  const authenticatedRequest = request as AuthenticatedRequest;
  const role = authenticatedRequest.user.role;

  if (role !== "admin" && role !== "branch_admin") {
    return next(
      new AppError(
        "Branch Admin access required for this operation.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      ),
    );
  }

  return next();
};

/**
 * Middleware enforcing branch-level scoping security.
 * Central Admin ('admin') bypasses and has global access across all branches.
 * Branch Admin ('branch_admin') must have a matching server-side branchId.
 */
export const requireBranchScope = (
  extractBranchId: (request: Request) => string | undefined,
): RequestHandler => {
  return (request, _response, next) => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const { role, branchId: userBranchId } = authenticatedRequest.user;

    if (role === "admin") {
      return next(); // Central Admin has platform-wide authorization
    }

    if (role !== "branch_admin" || !userBranchId) {
      return next(
        new AppError(
          "User does not have an active branch administration scope.",
          HTTP_STATUS.FORBIDDEN,
          [],
          true,
          APP_ERROR_CODES.AUTHORIZATION_FAILED,
        ),
      );
    }

    const targetBranchId = extractBranchId(request);

    if (!targetBranchId || targetBranchId.toString() !== userBranchId.toString()) {
      return next(
        new AppError(
          "Access denied: You are not authorized to perform operations for another branch.",
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

/**
 * Middleware ensuring the authenticated user has Delivery Agent privileges.
 */
export const requireDeliveryAgent: RequestHandler = (request, _response, next) => {
  const authenticatedRequest = request as AuthenticatedRequest;
  const role = authenticatedRequest.user.role;

  if (role !== "delivery_agent" && role !== "admin") {
    return next(
      new AppError(
        "Delivery Agent access required for this operation.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      ),
    );
  }

  return next();
};
