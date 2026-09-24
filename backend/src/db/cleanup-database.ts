import mongoose from "mongoose";
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
import { ComboModel } from "../modules/combo/model/combo.model.js";
import { CustomCakeInquiryModel } from "../modules/custom-cake/model/custom-cake-inquiry.model.js";
import { CustomCakeOptionModel } from "../modules/custom-cake/model/custom-cake-option.model.js";
import { RefreshTokenModel } from "../modules/auth/model/refresh-token.model.js";
import { CartModel } from "../modules/cart/model/cart.model.js";
import { logger } from "../shared/utils/logger.js";

export interface DatabaseAuditReport {
  droppedCollections: string[];
  cleanedRefreshTokens: number;
  cleanedCarts: number;
  bloatedDocumentsFound: {
    collection: string;
    id: string;
    field: string;
    sizeBytes: number;
  }[];
  activeCollections: {
    name: string;
    count: number;
    status: string;
  }[];
}

export const runDatabaseAuditAndCleanup = async (): Promise<DatabaseAuditReport> => {
  const report: DatabaseAuditReport = {
    droppedCollections: [],
    cleanedRefreshTokens: 0,
    cleanedCarts: 0,
    bloatedDocumentsFound: [],
    activeCollections: [],
  };

  await connectDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB database instance not accessible");
  }

  logger.info("--- STARTING DATABASE AUDIT & CLEANUP ---");

  // 1. Audit and drop dead/unnecessary collections
  const existingCollections = await db.listCollections().toArray();
  const colNames = existingCollections.map((c) => c.name);

  // Drop 'otps' (Legacy removed feature)
  if (colNames.includes("otps")) {
    const otpsCol = db.collection("otps");
    const count = await otpsCol.countDocuments();
    await db.dropCollection("otps");
    report.droppedCollections.push(`otps (${count} orphaned documents)`);
    logger.info({ count }, "Successfully dropped dead 'otps' collection");
  }

  // Drop 'activity_logs' (Unused duplicate of audit_logs)
  if (colNames.includes("activity_logs")) {
    const actCol = db.collection("activity_logs");
    const count = await actCol.countDocuments();
    if (count === 0) {
      await db.dropCollection("activity_logs");
      report.droppedCollections.push(`activity_logs (0 documents, unused duplicate)`);
      logger.info("Successfully dropped unused 'activity_logs' collection");
    }
  }

  // 2. Clean up stale/revoked RefreshTokens (purge revoked or expired tokens)
  const now = new Date();
  const tokenDeleteResult = await RefreshTokenModel.deleteMany({
    $or: [
      { revokedAt: { $exists: true, $ne: null } },
      { expiresAt: { $lt: now } },
    ],
  });
  report.cleanedRefreshTokens = tokenDeleteResult.deletedCount;
  logger.info(
    { deletedCount: tokenDeleteResult.deletedCount },
    "Cleaned up stale/revoked RefreshTokens",
  );

  // 3. Clean up abandoned & empty Carts (older than 7 days with no items, or older than 30 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const cartDeleteResult = await CartModel.deleteMany({
    $or: [
      { items: { $size: 0 }, updatedAt: { $lt: sevenDaysAgo } },
      { totalItems: 0, updatedAt: { $lt: sevenDaysAgo } },
      { updatedAt: { $lt: thirtyDaysAgo } },
    ],
  });
  report.cleanedCarts = cartDeleteResult.deletedCount;
  logger.info(
    { deletedCount: cartDeleteResult.deletedCount },
    "Cleaned up abandoned/empty guest carts",
  );

  // 4. Scan for Base64 Data Bloat in products, categories, occasions, combos
  const checkBlobInDocs = async (
    modelName: string,
    colName: string,
    fields: string[],
  ) => {
    const col = db.collection(colName);
    const docs = await col.find({}).toArray();
    for (const doc of docs) {
      for (const field of fields) {
        const val = doc[field];
        if (typeof val === "string" && val.startsWith("data:image")) {
          report.bloatedDocumentsFound.push({
            collection: colName,
            id: doc._id.toString(),
            field,
            sizeBytes: val.length,
          });
        } else if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            if (typeof val[i] === "string" && val[i].startsWith("data:image")) {
              report.bloatedDocumentsFound.push({
                collection: colName,
                id: doc._id.toString(),
                field: `${field}[${i}]`,
                sizeBytes: val[i].length,
              });
            }
          }
        }
      }
    }
  };

  if (colNames.includes("products")) {
    await checkBlobInDocs("Product", "products", ["imageUrls", "thumbnailUrl"]);
  }
  if (colNames.includes("categories")) {
    await checkBlobInDocs("Category", "categories", ["image"]);
  }
  if (colNames.includes("occasions")) {
    await checkBlobInDocs("Occasion", "occasions", ["image"]);
  }
  if (colNames.includes("combos")) {
    await checkBlobInDocs("Combo", "combos", ["image", "thumbnailUrl"]);
  }
  if (colNames.includes("custom_cake_options")) {
    await checkBlobInDocs("CustomCakeOption", "custom_cake_options", [
      "previewImage",
      "imageUrl",
    ]);
  }

  // 5. Ensure indexes for active models
  const activeModels: Array<{
    name: string;
    model: {
      createIndexes: () => Promise<unknown>;
      countDocuments: () => Promise<number>;
    };
  }> = [
    { name: "User", model: UserModel },
    { name: "Product", model: ProductModel },
    { name: "Order", model: OrderModel },
    { name: "Category", model: CategoryModel },
    { name: "Occasion", model: OccasionModel },
    { name: "Branch", model: BranchModel },
    { name: "Payment", model: PaymentModel },
    { name: "Coupon", model: CouponModel },
    { name: "Banner", model: BannerModel },
    { name: "Combo", model: ComboModel },
    { name: "CustomCakeInquiry", model: CustomCakeInquiryModel },
    { name: "CustomCakeOption", model: CustomCakeOptionModel },
    { name: "RefreshToken", model: RefreshTokenModel },
    { name: "Cart", model: CartModel },
  ];

  for (const { name, model } of activeModels) {
    try {
      await model.createIndexes();
      const count = await model.countDocuments();
      report.activeCollections.push({
        name,
        count,
        status: "ACTIVE & INDEXED",
      });
    } catch (err) {
      logger.warn({ model: name, error: err }, "Index verification note");
    }
  }

  logger.info("--- DATABASE AUDIT & CLEANUP COMPLETED ---");
  return report;
};

if (process.argv[1]?.includes("cleanup-database")) {
  runDatabaseAuditAndCleanup()
    .then((report) => {
      console.log("\n=================================");
      console.log("DATABASE AUDIT & CLEANUP SUMMARY:");
      console.log("=================================");
      console.log("1. Dropped Dead Collections:", report.droppedCollections);
      console.log("2. Purged Stale RefreshTokens:", report.cleanedRefreshTokens);
      console.log("3. Purged Abandoned Carts:", report.cleanedCarts);
      console.log(
        "4. Base64 Bloat Found:",
        report.bloatedDocumentsFound.length > 0
          ? report.bloatedDocumentsFound
          : "None detected! All images using clean URLs.",
      );
      console.log("5. Verified Active Collections:");
      console.table(report.activeCollections);
    })
    .catch((err) => {
      logger.error({ error: err }, "Audit and cleanup failed");
      process.exitCode = 1;
    })
    .finally(async () => {
      await disconnectDatabase().catch(() => undefined);
    });
}
