import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../../config/env.js";
import { APP_ERROR_CODES } from "../constants/app-error-code.js";
import { HTTP_STATUS } from "../constants/http-status.js";
import { ERROR_MESSAGES } from "../constants/messages.js";
import { AppError } from "../errors/app-error.js";
import { sendError } from "../responses/api-response.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof ZodError) {
    return sendError(response, {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      errors: error.issues,
      code: APP_ERROR_CODES.VALIDATION_ERROR,
    });
  }

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
