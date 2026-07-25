import mongoose from "mongoose";

import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";

export const connectDatabase = async (): Promise<void> => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
  });

  logger.info("MongoDB connected");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};

