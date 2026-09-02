import type { Options } from "express-rate-limit";

import { env } from "./env.js";
import { ERROR_MESSAGES } from "../shared/constants/messages.js";

export const globalRateLimitOptions: Partial<Options> = {
  windowMs: env.rateLimitWindowMs || 60000,
  limit: Math.max(env.rateLimitMax || 10000, 10000),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for static uploads, health checks, preflight requests, and image files
    return (
      req.method === "OPTIONS" ||
      req.path.startsWith("/uploads") ||
      req.path.includes("/health") ||
      /\.(jpg|jpeg|png|webp|svg|ico|gif|css|js)$/i.test(req.path)
    );
  },
  message: {
    success: false,
    message: ERROR_MESSAGES.TOO_MANY_REQUESTS,
    errors: [],
  },
};
