import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { UserModel, type User, type UserStatus } from "../model/index.js";

export const userRouter = Router();

const userIdParamSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid user id."),
});

const userStatusSchema = z.object({
  status: z.enum(["active", "blocked"]),
});

const listUsersQuerySchema = z.object({
  role: z.enum(["customer", "admin"]).optional(),
  status: z.enum(["active", "blocked"]).optional(),
});

import type { AuthenticatedRequest } from "../../auth/index.js";
import { VillageModel } from "../../village/model/village.model.js";
import { AddressModel, type Address } from "../../address/model/address.model.js";

const updateLocationSchema = z.object({
  villageId: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid villageId."),
  district: z.string().trim().min(2).max(120),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  profileImage: z.string().trim().url().or(z.literal("")).optional(),
});

const toUserResponse = (
  user: User,
  address?: {
    _id?: Types.ObjectId;
    phone?: string;
    village?: string;
    district?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
    isDefault?: boolean;
  } | null,
) => {
  const contactPhone = address?.phone || user.phone;
  return {
    id: user._id.toString(),
    name: user.name,
    phone: contactPhone,
    email: user.email,
    role: user.role,
    status: user.status,
    phoneVerified: user.phoneVerified ?? false,
    ...(user.profileImage ? { profileImage: user.profileImage } : {}),
    ...(user.currentLocation
      ? {
          currentLocation: {
            villageId: user.currentLocation.villageId.toString(),
            villageName: user.currentLocation.villageName,
            district: user.currentLocation.district,
            pincode: user.currentLocation.pincode,
          },
        }
      : address?.village
      ? {
          currentLocation: {
            villageId: "",
            villageName: address.village,
            district: address.district || "Central",
            pincode: address.pincode || "110001",
          },
        }
      : {}),
    ...(address
      ? {
          address: {
            ...(address._id ? { id: address._id.toString() } : {}),
            phone: address.phone,
            village: address.village,
            district: address.district,
            street: address.address,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            landmark: address.landmark,
            isDefault: address.isDefault,
          },
        }
      : {}),
    createdAt: user.createdAt.toISOString(),
  };
};

// Authenticated User: Update profile details (name, email, profileImage)
userRouter.patch(
  "/profile",
  requireAuth,
  validateRequest({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { name, email, profileImage } = req.body as z.infer<typeof updateProfileSchema>;

    const updateFields: Partial<User> = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email.toLowerCase();
    if (profileImage !== undefined) updateFields.profileImage = profileImage || undefined;

    const user = await UserModel.findByIdAndUpdate(
      authReq.user.id,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).exec();

    if (!user) {
      throw new AppError("User account not found.", HTTP_STATUS.NOT_FOUND);
    }

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: { user: toUserResponse(user) },
    });
  }),
);

// Authenticated Customer: Get current shopping location
userRouter.get(
  "/location",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const user = await UserModel.findById(authReq.user.id).exec();
    if (!user) {
      throw new AppError("User account not found.", HTTP_STATUS.NOT_FOUND);
    }

    const currentLocation = user.currentLocation
      ? {
          villageId: user.currentLocation.villageId.toString(),
          villageName: user.currentLocation.villageName,
          district: user.currentLocation.district,
          pincode: user.currentLocation.pincode,
        }
      : null;

    res.json({
      success: true,
      data: { currentLocation },
    });
  }),
);

// Authenticated Customer: Update current active shopping location
userRouter.patch(
  "/location",
  requireAuth,
  validateRequest({ body: updateLocationSchema }),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { villageId, district } = req.body as z.infer<typeof updateLocationSchema>;

    const village = await VillageModel.findById(villageId).exec();
    if (!village) {
      throw new AppError("Specified village not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (!village.isActive) {
      throw new AppError(
        "Selected village is currently inactive for deliveries.",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
      );
    }

    if (village.district.toLowerCase() !== district.trim().toLowerCase()) {
      throw new AppError(
        `Selected village '${village.name}' does not belong to district '${district}'.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
      );
    }

    const user = await UserModel.findById(authReq.user.id).exec();
    if (!user) {
      throw new AppError("User account not found.", HTTP_STATUS.NOT_FOUND);
    }

    user.currentLocation = {
      villageId: village._id,
      villageName: village.name,
      district: village.district,
      pincode: village.pincode,
    };

    await user.save();

    const formattedLocation = {
      villageId: village._id.toString(),
      villageName: village.name,
      district: village.district,
      pincode: village.pincode,
    };

    res.json({
      success: true,
      message: `Active shopping location updated to ${village.name}, ${village.district}.`,
      data: { currentLocation: formattedLocation },
    });
  }),
);

const adminOnly = [requireAuth, requireRoles(["admin"])] as const;

userRouter.get(
  "/",
  ...adminOnly,
  validateRequest({ query: listUsersQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof listUsersQuerySchema>;
    const filter: Partial<Pick<User, "role" | "status">> = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const users = await UserModel.find(filter).sort({ createdAt: -1 }).limit(100).exec();
    const userIds = users.map((u) => u._id);
    let addresses: Address[] = [];
    try {
      addresses = await AddressModel.find({ userId: { $in: userIds } })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();
    } catch {
      // Address lookup fallback
    }

    const addressMap = new Map<string, Address>();
    for (const addr of addresses) {
      const key = addr.userId.toString();
      const existing = addressMap.get(key);
      if (!existing) {
        addressMap.set(key, addr);
      } else if (!existing.phone && addr.phone) {
        addressMap.set(key, addr);
      }
    }

    // For users still missing phone/address, check recent order address snapshots
    const missingPhoneUserIds = users
      .filter((u) => !u.phone && !addressMap.get(u._id.toString())?.phone)
      .map((u) => u._id);

    if (missingPhoneUserIds.length > 0) {
      try {
        const { OrderModel } = await import("../../order/model/order.model.js");
        const recentOrders = await OrderModel.find({
          $or: [
            { userId: { $in: missingPhoneUserIds } },
            { customerId: { $in: missingPhoneUserIds } },
          ],
        })
          .sort({ createdAt: -1 })
          .exec();

        for (const ord of recentOrders) {
          const uId = (ord.userId || ord.customerId)?.toString();
          if (uId && ord.addressSnapshot?.phone) {
            const existing = addressMap.get(uId);
            if (!existing) {
              addressMap.set(uId, {
                phone: ord.addressSnapshot.phone,
                village: ord.addressSnapshot.village,
                district: ord.addressSnapshot.district,
                address: ord.addressSnapshot.street,
                city: ord.addressSnapshot.city,
                state: ord.addressSnapshot.state,
                pincode: ord.addressSnapshot.pincode,
              } as unknown as Address);
            } else if (!existing.phone) {
              existing.phone = ord.addressSnapshot.phone;
            }
          }
        }
      } catch {
        // order fallback
      }
    }

    res.json({
      success: true,
      data: {
        users: users.map((u) => toUserResponse(u, addressMap.get(u._id.toString()))),
      },
    });
  }),
);

userRouter.patch(
  "/:id/status",
  ...adminOnly,
  validateRequest({ params: userIdParamSchema, body: userStatusSchema }),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: UserStatus };
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true },
    ).exec();

    if (!user) {
      throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
    }

    res.json({ success: true, data: { user: toUserResponse(user) } });
  }),
);

const grantAdminSchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits.")
      .optional(),
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(["admin", "branch_admin"]).default("admin"),
    branchId: z
      .string()
      .refine((val) => Types.ObjectId.isValid(val), "Invalid branchId")
      .optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone number is required to grant admin access.",
  });

const updateAdminRoleSchema = z.object({
  role: z.enum(["admin", "branch_admin", "customer"]),
  branchId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), "Invalid branchId")
    .optional(),
});

const PRIMARY_ADMIN_EMAILS = ["ajaykterha@gmail.com", "ajayterha@gmail.com"];
const PRIMARY_ADMIN_PHONES = ["7897671632"];

const isPrimaryAdmin = (user: User): boolean => {
  if (user.email && PRIMARY_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return true;
  }
  if (user.phone && PRIMARY_ADMIN_PHONES.includes(user.phone)) {
    return true;
  }
  return false;
};

// Admin: List all Admins & Branch Staff
userRouter.get(
  "/admins",
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    const admins = await UserModel.find({
      role: { $in: ["admin", "branch_admin"] },
    })
      .sort({ createdAt: -1 })
      .exec();

    res.json({
      success: true,
      data: {
        admins: admins.map((u) => ({
          ...toUserResponse(u),
          isPrimaryOwner: isPrimaryAdmin(u),
          branchId: u.branchId ? u.branchId.toString() : undefined,
        })),
      },
    });
  }),
);

// Admin: Grant Admin access to a new or existing user by Email/Phone
userRouter.post(
  "/admins",
  ...adminOnly,
  validateRequest({ body: grantAdminSchema }),
  asyncHandler(async (req, res) => {
    const { email, phone, name, role, branchId } = req.body as z.infer<
      typeof grantAdminSchema
    >;

    const query: Record<string, unknown>[] = [];
    if (email) query.push({ email: email.toLowerCase() });
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
      query.push({ phone: normalizedPhone });
    }

    let user = await UserModel.findOne({ $or: query }).exec();

    if (user) {
      // User exists -> Upgrade role
      user.role = role;
      if (name && (!user.name || user.name === "The Online Bakery Customer")) {
        user.name = name;
      }
      if (email && !user.email) {
        user.email = email.toLowerCase();
      }
      if (phone && !user.phone) {
        user.phone = phone.replace(/\D/g, "").slice(-10);
      }
      if (branchId) {
        user.branchId = new Types.ObjectId(branchId);
      }
      user.status = "active";
      user.isVerified = true;
      await user.save();
    } else {
      // User does not exist yet -> Pre-register authorized admin account
      const normalizedPhone = phone
        ? phone.replace(/\D/g, "").slice(-10)
        : undefined;
      user = await UserModel.create({
        name: name || (email ? email.split("@")[0] : "Admin Staff"),
        email: email ? email.toLowerCase() : undefined,
        phone: normalizedPhone,
        role,
        branchId: branchId ? new Types.ObjectId(branchId) : undefined,
        status: "active",
        isVerified: true,
        authProviders: email ? ["google"] : ["phone"],
      });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: `Admin access granted to ${user.name} (${user.email || user.phone}).`,
      data: {
        admin: {
          ...toUserResponse(user),
          isPrimaryOwner: isPrimaryAdmin(user),
          branchId: user.branchId ? user.branchId.toString() : undefined,
        },
      },
    });
  }),
);

// Admin: Revoke Admin access (demote back to regular customer)
userRouter.delete(
  "/admins/:id",
  ...adminOnly,
  validateRequest({ params: userIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.params.id).exec();

    if (!user) {
      throw new AppError("Admin account not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (isPrimaryAdmin(user)) {
      throw new AppError(
        "Primary Owner admin account cannot be revoked.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    user.role = "customer";
    await user.save();

    res.json({
      success: true,
      message: `Admin privileges revoked for ${user.name}. Account is now a regular customer.`,
      data: { admin: toUserResponse(user) },
    });
  }),
);

// Admin: Change Admin role or assign branch
userRouter.patch(
  "/admins/:id/role",
  ...adminOnly,
  validateRequest({ params: userIdParamSchema, body: updateAdminRoleSchema }),
  asyncHandler(async (req, res) => {
    const { role, branchId } = req.body as z.infer<typeof updateAdminRoleSchema>;
    const user = await UserModel.findById(req.params.id).exec();

    if (!user) {
      throw new AppError("Admin account not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (isPrimaryAdmin(user) && role !== "admin") {
      throw new AppError(
        "Primary Owner must maintain full admin role.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    user.role = role;
    if (branchId) {
      user.branchId = new Types.ObjectId(branchId);
    } else if (role === "admin") {
      user.branchId = undefined;
    }
    await user.save();

    res.json({
      success: true,
      message: `Role updated for ${user.name}.`,
      data: {
        admin: {
          ...toUserResponse(user),
          isPrimaryOwner: isPrimaryAdmin(user),
        },
      },
    });
  }),
);

userRouter.get(
  "/:id",
  ...adminOnly,
  validateRequest({ params: userIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.params.id).exec();
    if (!user) {
      throw new AppError("Customer account not found.", HTTP_STATUS.NOT_FOUND);
    }
    let defaultAddress: Parameters<typeof toUserResponse>[1] = null;
    try {
      defaultAddress = await AddressModel.findOne({ userId: user._id })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();
    } catch {
      // Address lookup fallback
    }

    if (!defaultAddress || !defaultAddress.phone) {
      try {
        const { OrderModel } = await import("../../order/model/order.model.js");
        const lastOrder = await OrderModel.findOne({
          $or: [{ userId: user._id }, { customerId: user._id }],
        })
          .sort({ createdAt: -1 })
          .exec();

        if (lastOrder?.addressSnapshot?.phone) {
          if (!defaultAddress) {
            defaultAddress = {
              phone: lastOrder.addressSnapshot.phone,
              village: lastOrder.addressSnapshot.village,
              district: lastOrder.addressSnapshot.district,
              address: lastOrder.addressSnapshot.street,
              city: lastOrder.addressSnapshot.city,
              state: lastOrder.addressSnapshot.state,
              pincode: lastOrder.addressSnapshot.pincode,
            };
          } else if (!defaultAddress.phone) {
            defaultAddress.phone = lastOrder.addressSnapshot.phone;
          }
        }
      } catch {
        // Fallback
      }
    }

    res.json({
      success: true,
      data: { user: toUserResponse(user, defaultAddress) },
    });
  }),
);
