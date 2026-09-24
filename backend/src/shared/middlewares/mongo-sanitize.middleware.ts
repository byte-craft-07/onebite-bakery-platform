import type { NextFunction, Request, Response } from "express";

type QueryValue = Request["query"];
type Sanitizable = Record<string, unknown> | unknown[] | QueryValue;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.entries(value).reduce<Record<string, unknown>>(
    (sanitized, [key, item]) => {
      if (key.startsWith("$") || key.includes(".")) {
        return sanitized;
      }

      sanitized[key] = sanitizeValue(item);
      return sanitized;
    },
    {},
  );
};

export const mongoSanitize = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  if (request.body) {
    const sanitizedBody = sanitizeValue(request.body) as Sanitizable;
    Object.defineProperty(request, "body", {
      value: sanitizedBody,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  if (request.params) {
    const sanitizedParams = sanitizeValue(request.params) as Record<string, string>;
    Object.defineProperty(request, "params", {
      value: sanitizedParams,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  if (request.query) {
    const sanitizedQuery = sanitizeValue(request.query) as QueryValue;
    Object.defineProperty(request, "query", {
      value: sanitizedQuery,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  next();
};
