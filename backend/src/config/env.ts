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
};

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    // Missing NODE_ENV must fail closed: an unknown deployment must not
    // enable development-only authentication behaviour.
    .default("production"),
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
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  ACCESS_TOKEN_EXPIRES: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES: z.string().default("30d"),
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z.string().default("mailto:admin@theonlinebakery.in"),
  REQUIRE_DATABASE_CONNECTION: z.enum(["true", "false"]).optional(),
  REQUIRE_MONGODB_TRANSACTIONS: z.enum(["true", "false"]).optional(),
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
const requireDatabaseConnection =
  parsedEnv.data.REQUIRE_DATABASE_CONNECTION === undefined
    ? isProduction
    : parsedEnv.data.REQUIRE_DATABASE_CONNECTION === "true";
const requireMongoTransactions =
  parsedEnv.data.REQUIRE_MONGODB_TRANSACTIONS === undefined
    ? isProduction
    : parsedEnv.data.REQUIRE_MONGODB_TRANSACTIONS === "true";

const isUnsetOrPlaceholder = (value: string | undefined): boolean => {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("<") ||
    normalized.includes(">") ||
    normalized.startsWith("your_") ||
    normalized.startsWith("change-this") ||
    normalized.startsWith("development-")
  );
};

const requireProductionValue = (name: string, value: string | undefined): void => {
  if (isUnsetOrPlaceholder(value)) {
    throw new Error(`${name} must be configured with a non-placeholder value in production.`);
  }
};

if (isProduction && corsOrigins.length === 0) {
  throw new Error(
    "At least one CORS origin must be configured in production.",
  );
}

if (isProduction) {
  requireProductionValue("MONGODB_URI", parsedEnv.data.MONGODB_URI);
  requireProductionValue("JWT_SECRET", parsedEnv.data.JWT_SECRET);
  requireProductionValue("JWT_REFRESH_SECRET", parsedEnv.data.JWT_REFRESH_SECRET);
  requireProductionValue("RAZORPAY_KEY_ID", parsedEnv.data.RAZORPAY_KEY_ID);
  requireProductionValue("RAZORPAY_KEY_SECRET", parsedEnv.data.RAZORPAY_KEY_SECRET);
  requireProductionValue(
    "RAZORPAY_WEBHOOK_SECRET",
    parsedEnv.data.RAZORPAY_WEBHOOK_SECRET,
  );
  requireProductionValue("GOOGLE_CLIENT_ID", parsedEnv.data.GOOGLE_CLIENT_ID);
  requireProductionValue("GOOGLE_CLIENT_SECRET", parsedEnv.data.GOOGLE_CLIENT_SECRET);
  requireProductionValue("GOOGLE_CALLBACK_URL", parsedEnv.data.GOOGLE_CALLBACK_URL);
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
  jwtSecret:
    parsedEnv.data.JWT_SECRET ??
    "development-only-jwt-secret-change-before-production",
  jwtRefreshSecret:
    parsedEnv.data.JWT_REFRESH_SECRET ??
    "development-only-refresh-secret-change-before-production",
  accessTokenExpires: parsedEnv.data.ACCESS_TOKEN_EXPIRES,
  refreshTokenExpires: parsedEnv.data.REFRESH_TOKEN_EXPIRES,
  requireDatabaseConnection,
  requireMongoTransactions,
  razorpayKeyId: parsedEnv.data.RAZORPAY_KEY_ID,
  razorpayKeySecret: parsedEnv.data.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: parsedEnv.data.RAZORPAY_WEBHOOK_SECRET,
  resendApiKey: parsedEnv.data.RESEND_API_KEY,
  resendFromEmail:
    parsedEnv.data.RESEND_FROM_EMAIL ??
    parsedEnv.data.SENDER_EMAIL ??
    "ajaykterha@gmail.com",
  whatsappApiToken: parsedEnv.data.WHATSAPP_API_TOKEN,
  whatsappPhoneNumberId: parsedEnv.data.WHATSAPP_PHONE_NUMBER_ID,
  whatsappApiVersion: parsedEnv.data.WHATSAPP_API_VERSION,
  whatsappDefaultTemplate: parsedEnv.data.WHATSAPP_DEFAULT_TEMPLATE,
  whatsappDefaultLanguage: parsedEnv.data.WHATSAPP_DEFAULT_LANGUAGE,
  googleClientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: parsedEnv.data.GOOGLE_CALLBACK_URL,
  vapidPublicKey: parsedEnv.data.VAPID_PUBLIC_KEY,
  vapidPrivateKey: parsedEnv.data.VAPID_PRIVATE_KEY,
  vapidSubject: parsedEnv.data.VAPID_SUBJECT,
} as const;
