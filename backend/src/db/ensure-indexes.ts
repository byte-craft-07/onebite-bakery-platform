import { connectDatabase, disconnectDatabase } from "./connection.js";
import { UserModel } from "../modules/user/model/user.model.js";
import { ProductModel } from "../modules/product/model/product.model.js";
import { OrderModel } from "../modules/order/model/order.model.js";
import { CategoryModel } from "../modules/category/model/category.model.js";
import { OccasionModel } from "../modules/occasion/model/occasion.model.js";
import { BranchModel } from "../modules/branch/model/branch.model.js";
import { PaymentModel } from "../modules/payment/model/payment.model.js";
import { CouponModel } from "../modules/coupon/model/coupon.model.js";
import { BannerModel } from "../modules/banner/model/banner.model.js";
import { CustomCakeInquiryModel } from "../modules/custom-cake/model/custom-cake-inquiry.model.js";
import { CustomCakeOptionModel } from "../modules/custom-cake/model/custom-cake-option.model.js";
import { RefreshTokenModel } from "../modules/auth/model/refresh-token.model.js";
import { logger } from "../shared/utils/logger.js";

const modelsToEnsure = [
  { name: "User", model: UserModel },
  { name: "Product", model: ProductModel },
  { name: "Order", model: OrderModel },
  { name: "Category", model: CategoryModel },
  { name: "Occasion", model: OccasionModel },
  { name: "Branch", model: BranchModel },
  { name: "Payment", model: PaymentModel },
  { name: "Coupon", model: CouponModel },
  { name: "Banner", model: BannerModel },
  { name: "CustomCakeInquiry", model: CustomCakeInquiryModel },
  { name: "CustomCakeOption", model: CustomCakeOptionModel },
  { name: "RefreshToken", model: RefreshTokenModel },
];

export const ensureAllDatabaseIndexes = async (): Promise<void> => {
  let connected = false;

  try {
    await connectDatabase();
    connected = true;

    for (const { name, model } of modelsToEnsure) {
      await model.createIndexes();
      logger.info({ model: name }, `Ensured indexes for ${name} collection`);
    }

    logger.info("All production database indexes are synchronized and verified.");
  } finally {
    if (connected) {
      await disconnectDatabase();
    }
  }
};

void ensureAllDatabaseIndexes().catch((error: unknown) => {
  logger.fatal({ error }, "Failed to ensure database indexes");
  process.exitCode = 1;
});
