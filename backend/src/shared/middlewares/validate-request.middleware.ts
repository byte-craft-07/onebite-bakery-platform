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
      request.body = schemas.body.parse(request.body);
    }

    if (schemas.params) {
      request.params = schemas.params.parse(
        request.params,
      ) as typeof request.params;
    }

    if (schemas.query) {
      request.query = schemas.query.parse(request.query) as typeof request.query;
    }

    next();
  };
};
