import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { escapeRegex } from "../../../shared/utils/escape-regex.js";
import { VillageModel, type Village } from "../model/index.js";

export const villageRouter = Router();

const villageIdParamSchema = z.object({
  id: z.string().refine((val) => Types.ObjectId.isValid(val), "Invalid village id."),
});

const villagePayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  district: z.string().trim().min(2).max(120),
  pincode: z.string().trim().regex(/^[0-9]{4,10}$/),
  deliveryCharge: z.number().min(0).optional(),
  freeDeliveryThreshold: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const updateVillagePayloadSchema = villagePayloadSchema.partial();

const toVillageResponse = (village: Village) => ({
  id: village._id.toString(),
  name: village.name,
  district: village.district,
  pincode: village.pincode,
  deliveryCharge: village.deliveryCharge ?? 49,
  freeDeliveryThreshold: village.freeDeliveryThreshold ?? 799,
  isActive: village.isActive,
  createdAt: village.createdAt,
  updatedAt: village.updatedAt,
});

const adminOnly = [requireAuth, requireRoles(["admin"])] as const;

// Public: Get unique active districts list
villageRouter.get(
  "/districts",
  asyncHandler(async (_req, res) => {
    const districts = await VillageModel.distinct("district", { isActive: true }).exec();
    res.json({
      success: true,
      data: { districts: districts.sort() },
    });
  }),
);

// Public: Get active villages for user dropdown (supports optional ?district= filter)
villageRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const district = typeof req.query.district === "string" ? req.query.district.trim() : undefined;
    const filter: Record<string, unknown> = { isActive: true };

    if (district) {
      filter.district = new RegExp(`^${escapeRegex(district)}$`, "i");
    }

    const villages = await VillageModel.find(filter)
      .sort({ name: 1 })
      .exec();

    res.json({
      success: true,
      data: { villages: villages.map(toVillageResponse) },
    });
  }),
);

// Admin: Get all villages (including inactive)
villageRouter.get(
  "/admin",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const villages = await VillageModel.find({})
      .sort({ name: 1 })
      .exec();

    res.json({
      success: true,
      data: { villages: villages.map(toVillageResponse) },
    });
  }),
);

// Admin: Create a new village
villageRouter.post(
  "/",
  ...adminOnly,
  validateRequest({ body: villagePayloadSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof villagePayloadSchema>;

    const existing = await VillageModel.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(payload.name)}$`, "i") },
      district: { $regex: new RegExp(`^${escapeRegex(payload.district)}$`, "i") },
    }).exec();

    if (existing) {
      throw new AppError("Village already exists in this district.", HTTP_STATUS.CONFLICT);
    }

    const { BranchModel } = await import("../../branch/model/branch.model.js");
    const mainBranch = await BranchModel.findOne({ type: "MAIN", isActive: true }).exec()
      || await BranchModel.findOne({ isActive: true }).exec();

    const village = await VillageModel.create({
      name: payload.name,
      district: payload.district,
      pincode: payload.pincode,
      branchId: mainBranch ? mainBranch._id : undefined,
      deliveryCharge: payload.deliveryCharge ?? 49,
      freeDeliveryThreshold: payload.freeDeliveryThreshold ?? 799,
      isActive: payload.isActive ?? true,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: { village: toVillageResponse(village) },
    });
  }),
);

// Admin: Update village
villageRouter.patch(
  "/:id",
  ...adminOnly,
  validateRequest({ params: villageIdParamSchema, body: updateVillagePayloadSchema }),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const payload = req.body as z.infer<typeof updateVillagePayloadSchema>;

    const village = await VillageModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true },
    ).exec();

    if (!village) {
      throw new AppError("Village not found.", HTTP_STATUS.NOT_FOUND);
    }

    res.json({
      success: true,
      data: { village: toVillageResponse(village) },
    });
  }),
);

// Admin: Delete village
villageRouter.delete(
  "/:id",
  ...adminOnly,
  validateRequest({ params: villageIdParamSchema }),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const village = await VillageModel.findByIdAndDelete(id).exec();

    if (!village) {
      throw new AppError("Village not found.", HTTP_STATUS.NOT_FOUND);
    }

    res.json({ success: true, message: "Village deleted successfully." });
  }),
);
