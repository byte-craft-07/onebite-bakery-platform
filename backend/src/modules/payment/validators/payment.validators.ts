import { z } from "zod";

import { PAYMENT_PROVIDERS } from "../constants/index.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

export const paymentIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createPaymentSchema = z.object({
  orderId: objectIdSchema,
  provider: z.enum(PAYMENT_PROVIDERS).optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: objectIdSchema,
  razorpayOrderId: z.string().trim().min(5),
  razorpayPaymentId: z.string().trim().min(5),
  razorpaySignature: z.string().trim().min(10),
});
