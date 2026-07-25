import type { Options } from "express-rate-limit";

import { env } from "./env.js";
import { ERROR_MESSAGES } from "../shared/constants/messages.js";

export const globalRateLimitOptions: Partial<Options> = {
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: ERROR_MESSAGES.TOO_MANY_REQUESTS,
    errors: [],
  },
};

