import http from "node:http";

import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./db/connection.js";
import { seedDevelopmentData } from "./db/seed.js";
import { createApp } from "./app.js";
import { initSocketServer, closeSocketServer } from "./socket/index.js";
import { APP_ERROR_CODES } from "./shared/constants/app-error-code.js";
import { logger } from "./shared/utils/logger.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await seedDevelopmentData();
  } catch (error) {
    logger.error(
      { error, code: APP_ERROR_CODES.DATABASE_CONNECTION_FAILED },
      "MongoDB connection failed",
    );

    if (env.requireDatabaseConnection) {
      throw error;
    }
  }

  const app = createApp();
  const server = http.createServer(app);

  initSocketServer(server);

  server.listen(env.port, () => {
    logger.info(
      {
        environment: env.nodeEnv,
        port: env.port,
      },
      "Onebite Bakery Platform backend started with Socket.IO",
    );
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, "Shutting down backend");

    // Force exit after 10 seconds if shutdown hangs
    const forceExitTimer = setTimeout(() => {
      logger.warn("Graceful shutdown timed out after 10s — forcing process exit");
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    await closeSocketServer().catch(() => {});
    server.close(async () => {
      await disconnectDatabase().catch(() => {});
      clearTimeout(forceExitTimer);
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Catch unhandled promise rejections — log and keep the process alive
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error(
      { error: reason, code: APP_ERROR_CODES.INTERNAL_SERVER_ERROR },
      "Unhandled promise rejection detected — this should be investigated",
    );
  });

  // Catch uncaught synchronous exceptions — log and gracefully shut down
  process.on("uncaughtException", (error: Error) => {
    logger.fatal(
      { error, code: APP_ERROR_CODES.INTERNAL_SERVER_ERROR },
      "Uncaught exception detected — shutting down gracefully",
    );
    // Give the logger time to flush, then exit
    setTimeout(() => process.exit(1), 1000);
  });
};

startServer().catch((error: unknown) => {
  logger.fatal({ error }, "Failed to start backend");
  process.exit(1);
});
