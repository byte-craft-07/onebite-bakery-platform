import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";

async function updateBrandingInDB() {
  const uri = env.mongodbUri || "mongodb://127.0.0.1:27017/bakery-platform";
  logger.info({ uri }, "Connecting to MongoDB to update branding...");

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    logger.info("Connected to MongoDB successfully!");
    const db = mongoose.connection.db;
    if (!db) {
      logger.error("No database instance found");
      return;
    }

    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      const collection = db.collection(col.name);
      const docs = await collection.find({}).toArray();
      let updatedCount = 0;
      for (const doc of docs) {
        const str = JSON.stringify(doc);
        if (/online\s*bakery/i.test(str)) {
          const replacedStr = str
            .replace(/The Online Bakery Platform/g, "Onebite Bakery Platform")
            .replace(/the online bakery platform/g, "onebite bakery platform")
            .replace(/THE ONLINE BAKERY PLATFORM/g, "ONEBITE BAKERY PLATFORM")
            .replace(/The Online Bakery/g, "Onebite Bakery")
            .replace(/the online bakery/g, "onebite bakery")
            .replace(/THE ONLINE BAKERY/g, "ONEBITE BAKERY")
            .replace(/TheOnlineBakery/g, "OnebiteBakery")
            .replace(/theonlinebakery/g, "onebitebakery")
            .replace(/the-online-bakery/g, "onebite-bakery")
            .replace(/Online Bakery/g, "Onebite Bakery")
            .replace(/online bakery/g, "onebite bakery")
            .replace(/ONLINE BAKERY/g, "ONEBITE BAKERY")
            .replace(/The Onebite Bakery/g, "Onebite Bakery")
            .replace(/the onebite bakery/g, "onebite bakery");

          const updatedDoc = JSON.parse(replacedStr);
          await collection.replaceOne({ _id: doc._id }, { ...updatedDoc, _id: doc._id });
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        logger.info({ collection: col.name, updatedCount }, "Updated documents in collection");
      }
    }

    // Specially ensure the main branch is named Onebite Bakery Main Store / Onebite Bakery
    const branchCol = db.collection("branches");
    const branches = await branchCol.find({}).toArray();
    logger.info({ totalBranches: branches.length }, "Branches in MongoDB after update:");
    for (const b of branches) {
      logger.info(
        {
          id: b._id,
          name: b.name,
          code: b.code,
          type: b.type,
          street: b.address?.street,
        },
        "Branch Details"
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ error: message }, "Error updating branding in MongoDB");
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB.");
  }
}

void updateBrandingInDB();
