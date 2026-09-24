import { connectDatabase, disconnectDatabase } from "./connection.js";
import { seedInitialData } from "./seed.js";
import { logger } from "../shared/utils/logger.js";

const run = async (): Promise<void> => {
  try {
    logger.info("Connecting to database for seeding...");
    await connectDatabase();
    logger.info("Running seedInitialData...");
    await seedInitialData(true);
    logger.info("Seeding completed successfully.");
  } catch (error) {
    logger.error({ error }, "Error running seed script");
    process.exit(1);
  } finally {
    await disconnectDatabase().catch(() => {});
    process.exit(0);
  }
};

void run();
