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

const customCakeConfigSchema = z
  .object({
    flavour: z.string().trim().max(100).optional(),
    flavor: z.string().trim().max(100).optional(),
    weightKg: z.number().min(0.1).max(50).optional(),
    weight: z.string().trim().max(50).optional(),
    tierCount: z.number().int().min(1).max(10).optional(),
    tiers: z.number().int().min(1).max(10).optional(),
    shape: z.string().trim().max(50).optional(),
    designTheme: z.string().trim().max(100).optional(),
    eggPreference: z.enum(["EGG", "EGGLESS"]).optional(),
    eggless: z.boolean().optional(),
    isEggless: z.boolean().optional(),
    messageOnCake: z.string().trim().max(200).optional(),
    message: z.string().trim().max(200).optional(),
    specialInstructions: z.string().trim().max(1000).optional(),
    referenceImageUrl: z.string().trim().optional(),
    inquiryNumber: z.string().trim().optional(),
    estimatedPrice: z.number().optional(),
  })
  .passthrough();

export const addCartItemSchema = z.object({
  productId: z.string().trim().min(1, "Product id is required."),
  quantity: z.number().int().min(1, "Quantity must be greater than 0").default(1),
  selectedVariant: z.record(z.unknown()).optional(),
  customization: customCakeConfigSchema.optional(),
  customCakeConfig: customCakeConfigSchema.optional(),
  productDetails: z
    .object({
      name: z.string().optional(),
      price: z.number().optional(),
      mainImage: z.string().optional(),
      slug: z.string().optional(),
      isInstantAvailable: z.boolean().optional(),
    })
    .optional(),
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
