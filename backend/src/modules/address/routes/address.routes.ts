import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { requireAuth, type AuthenticatedRequest } from "../../auth/index.js";
import { normalizeIndianPhone } from "../../auth/utils/phone-normalizer.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { AddressModel, type Address } from "../model/index.js";
import { UserModel } from "../../user/model/index.js";
import { VillageModel } from "../../village/model/village.model.js";

export const addressRouter = Router();

const addressIdParamSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid address id."),
});

const addressPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().transform((val) => normalizeIndianPhone(val)),
  district: z.string().trim().min(2).max(120).optional(),
  village: z.string().trim().min(2).max(120).optional(),
  street: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(100).optional().default("City"),
  state: z.string().trim().min(2).max(100).optional().default("State"),
  pincode: z.string().trim().regex(/^[0-9]{4,10}$/),
  landmark: z.string().trim().max(200).optional(),
  addressType: z.enum(["HOME", "WORK", "OTHER"]).optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressPayloadSchema = addressPayloadSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required.",
);

type AddressResponse = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  district?: string;
  village?: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  addressType: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
};

const toAddressResponse = (address: Address): AddressResponse => ({
  id: address._id.toString(),
  name: address.fullName,
  email: address.email,
  phone: address.phone,
  district: address.district,
  village: address.village,
  street: address.address,
  city: address.city || "City",
  state: address.state || "State",
  pincode: address.pincode,
  ...(address.landmark ? { landmark: address.landmark } : {}),
  addressType: "HOME",
  isDefault: address.isDefault,
});

const getUserObjectId = (request: AuthenticatedRequest): Types.ObjectId =>
  new Types.ObjectId(request.user.id);

const getAddressIdParam = (params: Record<string, unknown>): string => {
  const id = params.id;

  if (typeof id !== "string") {
    throw new AppError("Invalid address id.", HTTP_STATUS.BAD_REQUEST);
  }

  return id;
};

const findOwnedAddress = async (
  userId: Types.ObjectId,
  addressId: string,
) => {
  const address = await AddressModel.findOne({
    _id: new Types.ObjectId(addressId),
    userId,
  }).exec();

  if (!address) {
    throw new AppError("Address not found.", HTTP_STATUS.NOT_FOUND);
  }

  return address;
};

addressRouter.use(requireAuth);

addressRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = getUserObjectId(req as AuthenticatedRequest);
    const addresses = await AddressModel.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();

    res.json({
      success: true,
      data: { addresses: addresses.map(toAddressResponse) },
    });
  }),
);

addressRouter.post(
  "/",
  validateRequest({ body: addressPayloadSchema }),
  asyncHandler(async (req, res) => {
    const userId = getUserObjectId(req as AuthenticatedRequest);
    const payload = req.body as z.infer<typeof addressPayloadSchema>;
    const existingCount = await AddressModel.countDocuments({ userId }).exec();
    const isDefault = payload.isDefault ?? existingCount === 0;

    if (isDefault) {
      await AddressModel.updateMany({ userId }, { $set: { isDefault: false } }).exec();
    }

    const address = await AddressModel.create({
      userId,
      fullName: payload.name,
      email: payload.email,
      phone: payload.phone,
      district: payload.district,
      village: payload.village,
      address: payload.street,
      city: payload.city || "City",
      state: payload.state || "State",
      pincode: payload.pincode,
      landmark: payload.landmark,
      isDefault,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
    });

    if (payload.phone) {
      try {
        const user = await UserModel.findById(userId).exec();
        if (user && !user.phone) {
          const conflict = await UserModel.findOne({ phone: payload.phone, _id: { $ne: userId } }).exec();
          if (!conflict) {
            user.phone = payload.phone;
            await user.save();
          }
        }
      } catch {
        // Safe fallback
      }
    }

    if (isDefault && payload.village) {
      try {
        const vDoc = await VillageModel.findOne({
          name: new RegExp(`^${payload.village.trim()}$`, "i"),
        }).exec();
        if (vDoc) {
          await UserModel.findByIdAndUpdate(userId, {
            $set: {
              currentLocation: {
                villageId: vDoc._id,
                villageName: vDoc.name,
                district: vDoc.district,
                pincode: vDoc.pincode,
              },
            },
          }).exec();
        }
      } catch {
        // Safe fallback
      }
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: { address: toAddressResponse(address) },
    });
  }),
);

addressRouter.put(
  "/:id",
  validateRequest({ params: addressIdParamSchema, body: updateAddressPayloadSchema }),
  asyncHandler(async (req, res) => {
    const userId = getUserObjectId(req as AuthenticatedRequest);
    const addressId = getAddressIdParam(req.params);
    const payload = req.body as z.infer<typeof updateAddressPayloadSchema>;

    if (payload.isDefault) {
      await AddressModel.updateMany({ userId }, { $set: { isDefault: false } }).exec();
    }

    const address = await AddressModel.findOneAndUpdate(
      { _id: new Types.ObjectId(addressId), userId },
      {
        $set: {
          ...(payload.name ? { fullName: payload.name } : {}),
          ...(payload.email !== undefined ? { email: payload.email } : {}),
          ...(payload.phone ? { phone: payload.phone } : {}),
          ...(payload.district !== undefined ? { district: payload.district } : {}),
          ...(payload.village !== undefined ? { village: payload.village } : {}),
          ...(payload.street ? { address: payload.street } : {}),
          ...(payload.city ? { city: payload.city } : {}),
          ...(payload.state ? { state: payload.state } : {}),
          ...(payload.pincode ? { pincode: payload.pincode } : {}),
          ...(payload.landmark !== undefined ? { landmark: payload.landmark } : {}),
          ...(payload.isDefault !== undefined ? { isDefault: payload.isDefault } : {}),
        },
      },
      { new: true, runValidators: true },
    ).exec();

    if (!address) {
      throw new AppError("Address not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (payload.phone) {
      try {
        const user = await UserModel.findById(userId).exec();
        if (user && !user.phone) {
          const conflict = await UserModel.findOne({ phone: payload.phone, _id: { $ne: userId } }).exec();
          if (!conflict) {
            user.phone = payload.phone;
            await user.save();
          }
        }
      } catch {
        // Safe fallback
      }
    }

    if (address.isDefault && address.village) {
      try {
        const vDoc = await VillageModel.findOne({
          name: new RegExp(`^${address.village.trim()}$`, "i"),
        }).exec();
        if (vDoc) {
          await UserModel.findByIdAndUpdate(userId, {
            $set: {
              currentLocation: {
                villageId: vDoc._id,
                villageName: vDoc.name,
                district: vDoc.district,
                pincode: vDoc.pincode,
              },
            },
          }).exec();
        }
      } catch {
        // Safe fallback
      }
    }

    res.json({ success: true, data: { address: toAddressResponse(address) } });
  }),
);

addressRouter.patch(
  "/:id/default",
  validateRequest({ params: addressIdParamSchema }),
  asyncHandler(async (req, res) => {
    const userId = getUserObjectId(req as AuthenticatedRequest);
    const address = await findOwnedAddress(userId, getAddressIdParam(req.params));

    await AddressModel.updateMany({ userId }, { $set: { isDefault: false } }).exec();
    address.isDefault = true;
    await address.save();

    if (address.village) {
      try {
        const vDoc = await VillageModel.findOne({
          name: new RegExp(`^${address.village.trim()}$`, "i"),
        }).exec();
        if (vDoc) {
          await UserModel.findByIdAndUpdate(userId, {
            $set: {
              currentLocation: {
                villageId: vDoc._id,
                villageName: vDoc.name,
                district: vDoc.district,
                pincode: vDoc.pincode,
              },
            },
          }).exec();
        }
      } catch {
        // Safe fallback
      }
    }

    res.json({ success: true, data: { address: toAddressResponse(address) } });
  }),
);

addressRouter.delete(
  "/:id",
  validateRequest({ params: addressIdParamSchema }),
  asyncHandler(async (req, res) => {
    const userId = getUserObjectId(req as AuthenticatedRequest);
    const address = await findOwnedAddress(userId, getAddressIdParam(req.params));
    const wasDefault = address.isDefault;

    await address.deleteOne();

    if (wasDefault) {
      const nextDefault = await AddressModel.findOne({ userId })
        .sort({ createdAt: -1 })
        .exec();

      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();

        if (nextDefault.village) {
          try {
            const vDoc = await VillageModel.findOne({
              name: new RegExp(`^${nextDefault.village.trim()}$`, "i"),
            }).exec();
            if (vDoc) {
              await UserModel.findByIdAndUpdate(userId, {
                $set: {
                  currentLocation: {
                    villageId: vDoc._id,
                    villageName: vDoc.name,
                    district: vDoc.district,
                    pincode: vDoc.pincode,
                  },
                },
              }).exec();
            }
          } catch {
            // Safe fallback
          }
        }
      } else {
        try {
          await UserModel.findByIdAndUpdate(userId, {
            $unset: { currentLocation: 1 },
          }).exec();
        } catch {
          // Safe fallback
        }
      }
    }

    res.json({ success: true });
  }),
);
