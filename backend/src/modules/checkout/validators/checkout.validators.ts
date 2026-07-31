import { z } from "zod";

import { DELIVERY_METHODS } from "../../order/constants/index.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

export const addressPayloadSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(15),
  street: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().min(5).max(10),
  landmark: z.string().trim().max(100).optional(),
});

export const checkoutPreviewQuerySchema = z.object({
  deliveryMethod: z.enum(DELIVERY_METHODS).optional(),
  addressId: objectIdSchema.optional(),
});

export const validateCheckoutSchema = z
  .object({
    deliveryMethod: z.enum(DELIVERY_METHODS),
    addressId: objectIdSchema.optional(),
    address: addressPayloadSchema.optional(),
  })
  .refine(
    (data) =>
      data.deliveryMethod !== "HOME_DELIVERY" || Boolean(data.addressId || data.address),
    {
      message: "Delivery address is required for Home Delivery.",
      path: ["addressId"],
    },
  );
