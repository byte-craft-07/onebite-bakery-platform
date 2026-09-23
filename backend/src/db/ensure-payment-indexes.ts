import { connectDatabase, disconnectDatabase } from "./connection.js";
import { PaymentModel } from "../modules/payment/model/payment.model.js";
import { logger } from "../shared/utils/logger.js";

const ensurePaymentIndexes = async (): Promise<void> => {
  let connected = false;

  try {
    await connectDatabase();
    connected = true;

    // createIndexes only adds declared indexes. Unlike syncIndexes, it never
    // drops existing database indexes as part of a deployment.
    await PaymentModel.createIndexes();
    logger.info("Payment uniqueness indexes are present.");
  } finally {
    if (connected) {
      await disconnectDatabase();
    }
  }
};

void ensurePaymentIndexes().catch((error: unknown) => {
  logger.fatal({ error }, "Unable to ensure payment indexes");
  process.exitCode = 1;
});
