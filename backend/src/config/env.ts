import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

import { API_PREFIX } from "../shared/constants/api-version.js";

const backendRootDir = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(backendRootDir, ".env") });
dotenv.config();

const environment = {
  ...process.env,
  MONGODB_URI: process.env.MONGODB_URI ?? process.env.MONGO_URI,
  RAZORPAY_KEY_SECRET:
    process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_SECRET,
  OTP_HASH_SECRET: process.env.OTP_HASH_SECRET ?? process.env.JWT_SECRET,
};

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
  JSON_BODY_LIMIT: z.string().default("50mb"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10000),
  LOG_LEVEL: z.string().default("info"),
  OTP_HASH_SECRET: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  SENDER_EMAIL: z.string().email().optional(),
  WHATSAPP_API_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_API_VERSION: z.string().min(1).default("v20.0"),
  WHATSAPP_DEFAULT_TEMPLATE: z.string().min(1).default("hello_world"),
  WHATSAPP_DEFAULT_LANGUAGE: z.string().min(1).default("en_US"),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  MSG91_AUTH_KEY: z.string().min(1).optional(),
  MSG91_TEMPLATE_ID: z.string().min(1).optional(),
  MSG91_SENDER_ID: z.string().min(1).optional(),
  ACCESS_TOKEN_EXPIRES: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES: z.string().default("30d"),
  REQUIRE_DATABASE_CONNECTION: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value ? value === "true" : process.env.NODE_ENV === "production")),
});

const parsedEnv = envSchema.safeParse(environment);

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

if (isProduction && !parsedEnv.data.OTP_HASH_SECRET) {
  throw new Error("OTP_HASH_SECRET must be configured in production.");
}

if (isProduction && !parsedEnv.data.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production.");
}

if (isProduction && !parsedEnv.data.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET must be configured in production.");
}

if (isProduction && !parsedEnv.data.RAZORPAY_KEY_ID) {
  throw new Error("RAZORPAY_KEY_ID must be configured in production.");
}

if (isProduction && !parsedEnv.data.RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_SECRET must be configured in production.");
}

if (isProduction && !parsedEnv.data.RAZORPAY_WEBHOOK_SECRET) {
  throw new Error("RAZORPAY_WEBHOOK_SECRET must be configured in production.");
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
  otpHashSecret:
    parsedEnv.data.OTP_HASH_SECRET ??
    "development-only-otp-hash-secret-change-before-production",
  jwtSecret:
    parsedEnv.data.JWT_SECRET ??
    "development-only-jwt-secret-change-before-production",
  jwtRefreshSecret:
    parsedEnv.data.JWT_REFRESH_SECRET ??
    "development-only-refresh-secret-change-before-production",
  accessTokenExpires: parsedEnv.data.ACCESS_TOKEN_EXPIRES,
  refreshTokenExpires: parsedEnv.data.REFRESH_TOKEN_EXPIRES,
  requireDatabaseConnection: parsedEnv.data.REQUIRE_DATABASE_CONNECTION,
  razorpayKeyId: parsedEnv.data.RAZORPAY_KEY_ID,
  razorpayKeySecret: parsedEnv.data.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: parsedEnv.data.RAZORPAY_WEBHOOK_SECRET,
  resendApiKey: parsedEnv.data.RESEND_API_KEY,
  resendFromEmail:
    parsedEnv.data.RESEND_FROM_EMAIL ??
    parsedEnv.data.SENDER_EMAIL ??
    "theonlinebakery07@gmail.com",
  whatsappApiToken: parsedEnv.data.WHATSAPP_API_TOKEN,
  whatsappPhoneNumberId: parsedEnv.data.WHATSAPP_PHONE_NUMBER_ID,
  whatsappApiVersion: parsedEnv.data.WHATSAPP_API_VERSION,
  whatsappDefaultTemplate: parsedEnv.data.WHATSAPP_DEFAULT_TEMPLATE,
  whatsappDefaultLanguage: parsedEnv.data.WHATSAPP_DEFAULT_LANGUAGE,
  googleClientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: parsedEnv.data.GOOGLE_CALLBACK_URL,
  msg91AuthKey: parsedEnv.data.MSG91_AUTH_KEY,
  msg91TemplateId: parsedEnv.data.MSG91_TEMPLATE_ID,
  msg91SenderId: parsedEnv.data.MSG91_SENDER_ID,
} as const;
