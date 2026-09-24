import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { cacheResponse, invalidateCache } from "../../../shared/middlewares/cache.middleware.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { SettingsModel, type Settings } from "../model/index.js";

export const settingsRouter = Router();

const settingPayloadSchema = z.object({
  storeName: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().min(10).max(20).optional(),
  email: z.string().trim().email().optional(),
  gstin: z.string().trim().max(32).optional(),
  minOrderValue: z.number().min(0).optional(),
  freeDeliveryThreshold: z.number().min(0).optional(),
  standardDeliveryCharge: z.number().min(0).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  isTaxEnabled: z.boolean().optional(),
  isOrderAcceptanceActive: z.boolean().optional(),
});

const defaultStoreTiming = {
  monday: { open: "09:00", close: "21:00", isClosed: false },
  tuesday: { open: "09:00", close: "21:00", isClosed: false },
  wednesday: { open: "09:00", close: "21:00", isClosed: false },
  thursday: { open: "09:00", close: "21:00", isClosed: false },
  friday: { open: "09:00", close: "21:00", isClosed: false },
  saturday: { open: "09:00", close: "21:00", isClosed: false },
  sunday: { open: "09:00", close: "21:00", isClosed: false },
};

const normalizePhone = (phone: string): string => phone.replace(/\D/g, "").slice(-15);

const getOrCreateSettings = async (): Promise<Settings> => {
  const existing = await SettingsModel.findOne({ singletonKey: "default" }).exec();

  if (existing) {
    return existing;
  }

  return SettingsModel.create({
    singletonKey: "default",
    bakeryName: "Onebite Bakery",
    phone: "7897671632",
    whatsapp: "7897671632",
    address: "Onebite Bakery, N 80°14, terha 25°49'43.3, 54.7\"E, hamirpur, Uttar Pradesh 210502",
    storeTiming: defaultStoreTiming,
    deliveryRadius: 15,
    deliveryCharge: 49,
    freeDeliveryThreshold: 799,
    taxRatePercent: 5,
    isTaxEnabled: true,
    delivery: {
      minimumHomeDeliveryAmount: 300,
      homeDeliveryEnabled: true,
      pickupEnabled: true,
    },
    socialLinks: {},
    isDeliveryEnabled: true,
    isPickupEnabled: true,
    isCodEnabled: true,
    isUpiEnabled: true,
  });
};

const toSettingsResponse = (settings: Settings) => ({
  storeName: settings.bakeryName,
  officialHindiTagline: "हर जश्न का पहला निवाला।",
  officialEnglishTagline: "Pure Joy in Every Single Bite",
  phone: `+91 ${settings.phone}`,
  email: "ajaykterha@gmail.com",
  gstin: "07AAAAA0000A1Z5",
  fssaiLicNo: "10020011000123",
  address: settings.address,
  deliveryRadiusKm: settings.deliveryRadius,
  minOrderAmount: settings.delivery.minimumHomeDeliveryAmount,
  minOrderValue: settings.delivery.minimumHomeDeliveryAmount,
  freeDeliveryThreshold: settings.freeDeliveryThreshold ?? 799,
  standardDeliveryCharge: settings.deliveryCharge ?? 49,
  taxRatePercent: settings.taxRatePercent ?? 5,
  isTaxEnabled: settings.isTaxEnabled ?? true,
  isOrderAcceptanceActive: settings.isDeliveryEnabled || settings.isPickupEnabled,
  delivery: settings.delivery,
});

settingsRouter.get(
  "/",
  cacheResponse({ ttlSeconds: 900, tags: ["settings"] }),
  asyncHandler(async (_req, res) => {
    const settings = await getOrCreateSettings();

    res.json({
      success: true,
      data: { settings: toSettingsResponse(settings) },
    });
  }),
);

settingsRouter.put(
  "/",
  requireAuth,
  requireRoles(["admin"]),
  validateRequest({ body: settingPayloadSchema }),
  invalidateCache(["settings"]),
  asyncHandler(async (req, res) => {
    const current = await getOrCreateSettings();
    const payload = req.body as z.infer<typeof settingPayloadSchema>;

    const settings = await SettingsModel.findOneAndUpdate(
      { singletonKey: "default" },
      {
        $set: {
          bakeryName: payload.storeName ?? current.bakeryName,
          phone: payload.phone ? normalizePhone(payload.phone) : current.phone,
          deliveryCharge: payload.standardDeliveryCharge ?? current.deliveryCharge,
          freeDeliveryThreshold: payload.freeDeliveryThreshold ?? current.freeDeliveryThreshold,
          taxRatePercent: payload.taxRatePercent ?? current.taxRatePercent,
          isTaxEnabled: payload.isTaxEnabled ?? current.isTaxEnabled,
          isDeliveryEnabled: payload.isOrderAcceptanceActive ?? current.isDeliveryEnabled,
          isPickupEnabled: payload.isOrderAcceptanceActive ?? current.isPickupEnabled,
          "delivery.minimumHomeDeliveryAmount":
            payload.minOrderValue ?? current.delivery.minimumHomeDeliveryAmount,
          "delivery.homeDeliveryEnabled":
            payload.isOrderAcceptanceActive ?? current.delivery.homeDeliveryEnabled,
          "delivery.pickupEnabled":
            payload.isOrderAcceptanceActive ?? current.delivery.pickupEnabled,
        },
      },
      { new: true, runValidators: true },
    ).exec();

    res.json({
      success: true,
      data: { settings: toSettingsResponse(settings ?? current) },
    });
  }),
);
