import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../../config/env.js";
import { APP_ERROR_CODES } from "../constants/app-error-code.js";
import { HTTP_STATUS } from "../constants/http-status.js";
import { ERROR_MESSAGES } from "../constants/messages.js";
import { AppError } from "../errors/app-error.js";
import { sendError } from "../responses/api-response.js";
import { logger } from "../utils/logger.js";

/**
 * Extract the human-readable duplicate field name from a MongoDB 11000 error.
 */
const extractDuplicateField = (error: Record<string, unknown>): string => {
  const keyPattern = error.keyPattern;
  if (keyPattern && typeof keyPattern === "object") {
    const fields = Object.keys(keyPattern as Record<string, unknown>);
    if (fields.length > 0) return fields.join(", ");
  }

  const message = String(error.message ?? "");
  const match = message.match(/index:\s+\w+\$?([\w.]+)/);
  return match?.[1] ?? "field";
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  // ── Zod validation errors ──
  if (error instanceof ZodError) {
    return sendError(response, {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: error.issues,
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // ── Application-level errors (AppError) ──
  if (error instanceof AppError) {
    if (error.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      logger.error({ error }, error.message);
    }

    return sendError(response, {
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors,
      code: error.code,
    });
  }

  // ── Mongoose CastError (invalid ObjectId, bad type coercion) ──
  if (error?.name === "CastError") {
    const field = error.path ?? "id";
    return sendError(response, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: `Invalid ${field} format. Please provide a valid identifier.`,
      errors: [
        {
          field,
          value: error.value,
          kind: error.kind,
        },
      ],
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // ── Mongoose ValidationError (schema-level validation failures) ──
  if (error?.name === "ValidationError" && error.errors && typeof error.errors === "object") {
    const fieldErrors = Object.entries(
      error.errors as Record<string, { message: string; path: string; kind: string }>,
    ).map(([field, details]) => ({
      field,
      message: details?.message ?? "Invalid value",
      kind: details?.kind ?? "unknown",
    }));

    return sendError(response, {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: fieldErrors,
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // ── MongoDB duplicate key error (code 11000) ──
  if (error?.code === 11000 || error?.code === 11001) {
    const duplicateField = extractDuplicateField(error);
    return sendError(response, {
      statusCode: HTTP_STATUS.CONFLICT,
      message: `A record with this ${duplicateField} already exists. Please use a different value.`,
      errors: [
        {
          field: duplicateField,
          keyValue: error.keyValue ?? {},
        },
      ],
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // ── Multer file upload errors ──
  if (error?.name === "MulterError") {
    const multerMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: "File is too large. Please upload a smaller file.",
      LIMIT_FILE_COUNT: "Too many files. Please reduce the number of files.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field. Please check the upload field name.",
      LIMIT_PART_COUNT: "Too many parts in multipart request.",
      LIMIT_FIELD_KEY: "Field name is too long.",
      LIMIT_FIELD_VALUE: "Field value is too long.",
      LIMIT_FIELD_COUNT: "Too many fields in request.",
    };

    return sendError(response, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: multerMessages[error.code as string] ?? "File upload error. Please try again.",
      errors: [{ multerCode: error.code, field: error.field }],
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // ── Malformed JSON body (Express JSON parse error) ──
  if (
    error instanceof SyntaxError &&
    "body" in error &&
    (error as Record<string, unknown>).type === "entity.parse.failed"
  ) {
    return sendError(response, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: "Invalid JSON in request body. Please check your request format.",
      errors: [],
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  // ── JWT authentication errors ──
  if (error?.name === "JsonWebTokenError") {
    return sendError(response, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: "Invalid authentication token. Please log in again.",
      errors: [],
      code: APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
    });
  }

  if (error?.name === "TokenExpiredError") {
    return sendError(response, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: "Your session has expired. Please log in again.",
      errors: [],
      code: APP_ERROR_CODES.INVALID_REFRESH_TOKEN,
    });
  }

  // ── Catch-all: Unknown / unhandled errors ──
  logger.error({ error }, "Unhandled application error");

  return sendError(response, {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message:
      env.nodeEnv === "development" && error instanceof Error
        ? error.message
        : ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    errors: [],
    code: APP_ERROR_CODES.INTERNAL_SERVER_ERROR,
  });
};
