import { env } from "../config/env.js";
import { UserModel } from "../modules/user/model/user.model.js";
import { logger } from "../shared/utils/logger.js";

export const seedDevelopmentData = async (): Promise<void> => {
  if (env.nodeEnv !== "development") {
    return;
  }

  try {
    const existingAdmin = await UserModel.findOne({
      $or: [{ phone: "9999999999" }, { email: "admin@onebite.local" }],
    });

    if (!existingAdmin) {
      await UserModel.create({
        name: "Development Admin",
        phone: "9999999999",
        email: "admin@onebite.local",
        role: "admin",
        isVerified: true,
        status: "active",
        lastLogin: new Date(),
      });
      logger.info(
        "Development admin seeded (email: admin@onebite.local, phone: 9999999999)",
      );
    } else if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      await existingAdmin.save();
      logger.info("Promoted development user to admin role");
    }
  } catch (error) {
    logger.warn({ error }, "Skipping dev seed due to database error");
  }
};
