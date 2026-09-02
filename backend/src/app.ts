import path from "node:path";
import type { IncomingMessage } from "node:http";
import compression from "compression";
import cookieParser from "cookie-parser";
import express, { type Application } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import pinoHttp from "pino-http";

import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { globalRateLimitOptions } from "./config/rate-limit.js";
import { apiRoutes } from "./routes.js";
import { errorHandler } from "./shared/middlewares/error-handler.middleware.js";
import { mongoSanitize } from "./shared/middlewares/mongo-sanitize.middleware.js";
import { notFoundHandler } from "./shared/middlewares/not-found.middleware.js";
import { logger } from "./shared/utils/logger.js";

interface RawBodyRequest extends IncomingMessage {
  rawBody?: Buffer;
}

export const createApp = (): Application => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      redact: ["req.headers.authorization", "req.headers.cookie"],
    }),
  );
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors(corsOptions));

  // High performance static caching headers for uploaded images and media
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "uploads"), {
      maxAge: "7d",
      etag: true,
      lastModified: true,
      immutable: true,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      },
    }),
  );

  app.use(rateLimit(globalRateLimitOptions));
  app.use(cookieParser());
  app.use(
    express.json({
      limit: env.jsonBodyLimit || "50mb",
      verify: (request: RawBodyRequest, _response, buffer) => {
        request.rawBody = Buffer.from(buffer);
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: env.jsonBodyLimit || "50mb" }));
  app.use(mongoSanitize);
  app.use(hpp());
  app.use(compression());

  app.use(env.apiPrefix, apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
