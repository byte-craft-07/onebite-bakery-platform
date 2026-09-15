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
      "The Online Bakery Platform backend started with Socket.IO",
    );
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, "Shutting down backend");
    await closeSocketServer().catch(() => {});
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch((error: unknown) => {
  logger.fatal({ error }, "Failed to start backend");
  process.exit(1);
});
