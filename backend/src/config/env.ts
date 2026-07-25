import dotenv from "dotenv";
import { z } from "zod";

import { API_PREFIX } from "../shared/constants/api-version.js";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default(API_PREFIX),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://127.0.0.1:27017/bakery-platform"),
  CLIENT_URL: z.string().url().optional(),
  ADMIN_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional(),
  JSON_BODY_LIMIT: z.string().default("1mb"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  LOG_LEVEL: z.string().default("info"),
  REQUIRE_DATABASE_CONNECTION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment configuration: ${parsedEnv.error.message}`,
  );
}

const resolveCorsOrigins = (): string[] => {
  if (parsedEnv.data.CORS_ORIGINS) {
    return parsedEnv.data.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return [parsedEnv.data.CLIENT_URL, parsedEnv.data.ADMIN_URL].filter(
    (origin): origin is string => Boolean(origin),
  );
};

const corsOrigins = resolveCorsOrigins();
const isProduction = parsedEnv.data.NODE_ENV === "production";

if (isProduction && corsOrigins.length === 0) {
  throw new Error(
    "At least one CORS origin must be configured in production.",
  );
}

export const env = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  apiPrefix: parsedEnv.data.API_PREFIX,
  mongodbUri: parsedEnv.data.MONGODB_URI,
  corsOrigins,
  jsonBodyLimit: parsedEnv.data.JSON_BODY_LIMIT,
  rateLimitWindowMs: parsedEnv.data.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: parsedEnv.data.RATE_LIMIT_MAX,
  logLevel: parsedEnv.data.LOG_LEVEL,
  requireDatabaseConnection: parsedEnv.data.REQUIRE_DATABASE_CONNECTION,
} as const;
