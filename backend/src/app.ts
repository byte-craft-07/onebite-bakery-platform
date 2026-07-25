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
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(rateLimit(globalRateLimitOptions));
  app.use(cookieParser());
  app.use(express.json({ limit: env.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: env.jsonBodyLimit }));
  app.use(mongoSanitize);
  app.use(hpp());
  app.use(compression());

  app.use(env.apiPrefix, apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
