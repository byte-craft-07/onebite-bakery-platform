import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters.")
    .max(20, "Code cannot exceed 20 characters.")
    .transform((val) => val.trim().toUpperCase()),
  description: z.string().max(200).optional(),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().positive("Discount value must be greater than 0."),
  minOrderAmount: z.number().min(0, "Min order amount cannot be negative.").default(0),
  maxDiscountAmount: z.number().positive().optional(),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  usageLimit: z.number().positive().optional(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export const applyCouponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required.")
    .transform((val) => val.trim().toUpperCase()),
  subtotal: z.number().min(0).optional(),
});

export type CreateCouponDto = z.infer<typeof createCouponSchema>;
export type UpdateCouponDto = z.infer<typeof updateCouponSchema>;
export type ApplyCouponDto = z.infer<typeof applyCouponSchema>;
