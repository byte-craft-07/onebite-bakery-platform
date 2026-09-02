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

export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    if (env.nodeEnv !== "production") {
      const isDevTunnel =
        origin.endsWith(".devtunnels.ms") ||
        origin.endsWith(".ngrok-free.app") ||
        origin.endsWith(".loca.lt");
      const isLocalNetworkIp = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
        origin,
      );

      if (isDevTunnel || isLocalNetworkIp) {
        callback(null, true);
        return;
      }
    }

    callback(new Error("CORS origin is not allowed"));
  },
};

