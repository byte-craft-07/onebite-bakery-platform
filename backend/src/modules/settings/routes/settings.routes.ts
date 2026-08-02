import { Router } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler.js";

export const settingsRouter = Router();

let storeSettings = {
  storeName: "OneBite Artisanal Bakery",
  officialHindiTagline: "हर जश्न का पहला निवाला।",
  officialEnglishTagline: "Pure Joy in Every Single Bite",
  phone: "+91 9876543210",
  email: "orders@onebitebakery.in",
  gstin: "07AAAAA0000A1Z5",
  fssaiLicNo: "10020011000123",
  address: "Block C, Main Market Road, Civil Lines, New Delhi - 110054",
  deliveryRadiusKm: 15,
  minOrderAmount: 250,
  freeDeliveryThreshold: 500,
  taxRatePercent: 5,
};

settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: { settings: storeSettings },
    });
  }),
);

settingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    storeSettings = { ...storeSettings, ...req.body };
    res.json({
      success: true,
      data: { settings: storeSettings },
    });
  }),
);
