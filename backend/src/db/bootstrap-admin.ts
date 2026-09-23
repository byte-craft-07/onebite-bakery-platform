import { connectDatabase, disconnectDatabase } from "./connection.js";
import { UserModel } from "../modules/user/model/user.model.js";
import { logger } from "../shared/utils/logger.js";

const getBootstrapAdminEmail = (): string => {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error(
      "BOOTSTRAP_ADMIN_EMAIL must contain the verified user's email address.",
    );
  }

  return email;
};

const bootstrapAdmin = async (): Promise<void> => {
  const email = getBootstrapAdminEmail();
  let connected = false;

  try {
    await connectDatabase();
    connected = true;

    const user = await UserModel.findOne({ email }).exec();

    if (!user) {
      throw new Error(
        "No user exists for BOOTSTRAP_ADMIN_EMAIL. Sign in with that Google account first, then rerun this command.",
      );
    }

    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    logger.info({ userId: user._id.toString() }, "Bootstrap admin role is present.");
  } finally {
    if (connected) {
      await disconnectDatabase();
    }
  }
};

void bootstrapAdmin().catch((error: unknown) => {
  logger.fatal({ error }, "Unable to bootstrap admin role");
  process.exitCode = 1;
});
