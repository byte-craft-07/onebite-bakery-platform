import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./db/connection.js";
import { createApp } from "./app.js";
import { APP_ERROR_CODES } from "./shared/constants/app-error-code.js";
import { logger } from "./shared/utils/logger.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
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
  const server = app.listen(env.port, () => {
    logger.info(
      {
        environment: env.nodeEnv,
        port: env.port,
      },
      "Bakery Platform backend started",
    );
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, "Shutting down backend");
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
