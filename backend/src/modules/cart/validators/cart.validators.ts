import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

export const cartItemIdParamSchema = z.object({
  itemId: objectIdSchema,
});

export const customerIdParamSchema = z.object({
  customerId: objectIdSchema,
});

const customCakeConfigSchema = z.object({
  flavour: z.string().trim().min(2).max(100).optional(),
  weightKg: z.number().min(0.25).max(20).optional(),
  tierCount: z.number().int().min(1).max(5).optional(),
  eggPreference: z.enum(["EGG", "EGGLESS"]).optional(),
  messageOnCake: z.string().trim().max(100).optional(),
  specialInstructions: z.string().trim().max(500).optional(),
});

export const addCartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1, "Quantity must be greater than 0").default(1),
  selectedVariant: z.record(z.unknown()).optional(),
  customization: customCakeConfigSchema.optional(),
  customCakeConfig: customCakeConfigSchema.optional(),
  notes: z.string().trim().max(300).optional(),
  sessionId: z.string().trim().min(5).max(100).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be greater than 0").optional(),
  notes: z.string().trim().max(300).optional(),
  sessionId: z.string().trim().min(5).max(100).optional(),
});

export const mergeCartSchema = z.object({
  sessionId: z.string().trim().min(5).max(100),
});
