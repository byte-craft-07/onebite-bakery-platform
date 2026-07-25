import type { Response } from "express";

import { HTTP_STATUS } from "../constants/http-status.js";
import { SUCCESS_MESSAGES } from "../constants/messages.js";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  SendErrorOptions,
  SendSuccessOptions,
} from "../types/api-response.types.js";

export const sendSuccess = <TData>(
  response: Response,
  options: SendSuccessOptions<TData>,
): Response => {
  const body: ApiSuccessResponse<TData | Record<string, never>> = {
    success: true,
    message: options.message ?? SUCCESS_MESSAGES.SUCCESS,
    data: options.data ?? {},
  };

  return response.status(options.statusCode ?? HTTP_STATUS.OK).json(body);
};

export const sendError = (
  response: Response,
  options: SendErrorOptions,
): Response => {
  const body: ApiErrorResponse = {
    success: false,
    message: options.message,
    errors: options.errors ?? [],
    ...(options.code ? { code: options.code } : {}),
  };

  return response
    .status(options.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(body);
};
