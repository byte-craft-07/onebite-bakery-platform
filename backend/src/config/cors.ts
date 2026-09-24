import type { CorsOptions } from "cors";

import { env } from "./env.js";

const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
] as const;

const allowedOrigins =
  env.nodeEnv === "production"
    ? env.corsOrigins
    : [...env.corsOrigins, ...developmentOrigins];

const normalizedAllowedOrigins = allowedOrigins.map((o) => o.trim().replace(/\/+$/, ""));

export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, "");

    if (
      normalizedAllowedOrigins.includes("*") ||
      normalizedAllowedOrigins.includes(normalizedOrigin)
    ) {
      callback(null, true);
      return;
    }

    if (env.nodeEnv !== "production") {
      const isDevTunnel =
        normalizedOrigin.endsWith(".devtunnels.ms") ||
        normalizedOrigin.endsWith(".ngrok-free.app") ||
        normalizedOrigin.endsWith(".loca.lt");
      const isLocalNetworkIp = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
        normalizedOrigin,
      );

      if (isDevTunnel || isLocalNetworkIp) {
        callback(null, true);
        return;
      }
    }

    callback(null, false);
  },
};

