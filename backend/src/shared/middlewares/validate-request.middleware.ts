import type { RequestHandler } from "express";
import type { ZodType } from "zod";

interface RequestValidationSchemas {
  body?: ZodType<unknown>;
  params?: ZodType<unknown>;
  query?: ZodType<unknown>;
}

export const validateRequest = (
  schemas: RequestValidationSchemas,
): RequestHandler => {
  return (request, _response, next) => {
    if (schemas.body) {
      const parsedBody = schemas.body.parse(request.body);
      Object.defineProperty(request, "body", {
        value: parsedBody,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }

    if (schemas.params) {
      const parsedParams = schemas.params.parse(request.params);
      Object.defineProperty(request, "params", {
        value: parsedParams,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }

    if (schemas.query) {
      const parsedQuery = schemas.query.parse(request.query);
      Object.defineProperty(request, "query", {
        value: parsedQuery,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }

    next();
  };
};
