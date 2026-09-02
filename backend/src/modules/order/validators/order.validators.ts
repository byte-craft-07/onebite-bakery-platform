import { z } from "zod";

import { DELIVERY_METHODS, ORDER_STATUSES, PAYMENT_METHODS } from "../constants/index.js";

const objectIdSchema = z.string().trim().min(1, "Invalid id.");


export const orderIdParamSchema = z.object({
  id: objectIdSchema,
});

export const addressPayloadSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(15),
  street: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().min(5).max(10),
  landmark: z.string().trim().max(100).optional(),
});

export const createOrderSchema = z
  .object({
    deliveryMethod: z.enum(DELIVERY_METHODS),
    paymentMethod: z.enum(PAYMENT_METHODS).optional().default("UPI"),
    addressId: objectIdSchema.optional(),
    address: addressPayloadSchema.optional(),
    notes: z.string().trim().max(500).optional(),
    deliveryTimingType: z.enum(["INSTANT", "SCHEDULED"]).optional().default("INSTANT"),
    deliveryTimePreference: z.string().trim().max(200).optional(),
    scheduledDate: z.string().trim().optional(),
    scheduledTimeSlot: z.string().trim().max(100).optional(),
  })
  .refine(
    (data) =>
      data.deliveryMethod !== "HOME_DELIVERY" || Boolean(data.addressId || data.address),
    {
      message: "Delivery address is required for Home Delivery.",
      path: ["addressId"],
    },
  );

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  cancellationReason: z.string().trim().max(500).optional(),
});

export const updateReadyTimeSchema = z.object({
  estimatedReadyTime: z.string().datetime(),
});

export const cancelOrderSchema = z.object({
  cancellationReason: z.string().trim().max(500).optional(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  customerId: objectIdSchema.optional(),
});
