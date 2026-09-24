import mongoose from "mongoose";

import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";
import { assertMongoTransactionsSupported } from "./utils/transaction-capability.js";

let hasRegisteredEventListeners = false;

const registerConnectionEventListeners = (): void => {
  if (hasRegisteredEventListeners) return;
  hasRegisteredEventListeners = true;

  mongoose.connection.on("error", (err) => {
    logger.error({ error: err }, "MongoDB connection error occurred");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected successfully");
  });
};

export const connectDatabase = async (): Promise<void> => {
  mongoose.set("strictQuery", true);
  registerConnectionEventListeners();

  try {
    await mongoose.connect(env.mongodbUri, {
      autoIndex: env.nodeEnv !== "production",
    });

    if (env.requireMongoTransactions) {
      await assertMongoTransactionsSupported();
    }
  } catch (error: unknown) {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => undefined);
    }
    throw error;
  }

  logger.info("MongoDB connected");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};
