import type { RequestHandler } from "express";

import { APP_ERROR_CODES } from "../constants/app-error-code.js";
import { HTTP_STATUS } from "../constants/http-status.js";
import { ERROR_MESSAGES } from "../constants/messages.js";
import { AppError } from "../errors/app-error.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError(
      `${ERROR_MESSAGES.ROUTE_NOT_FOUND}: ${request.method} ${request.originalUrl}`,
      HTTP_STATUS.NOT_FOUND,
      [],
      true,
      APP_ERROR_CODES.ROUTE_NOT_FOUND,
    ),
  );
};
