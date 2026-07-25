import type { Request } from "express";

import type { RequestContext } from "../types/request-context.types.js";

export const createRequestContext = (request: Request): RequestContext => {
  return {
    requestId:
      typeof request.id === "undefined" ? undefined : String(request.id),
    ip: request.ip,
    userAgent: request.get("user-agent"),
  };
};
