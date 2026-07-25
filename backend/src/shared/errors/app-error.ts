import {
  APP_ERROR_CODES,
  type AppErrorCode,
} from "../constants/app-error-code.js";
import { HTTP_STATUS, type HttpStatus } from "../constants/http-status.js";

export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly errors: unknown[];
  public readonly isOperational: boolean;
  public readonly code: AppErrorCode;

  public constructor(
    message: string,
    statusCode: HttpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors: unknown[] = [],
    isOperational = true,
    code: AppErrorCode = APP_ERROR_CODES.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}
