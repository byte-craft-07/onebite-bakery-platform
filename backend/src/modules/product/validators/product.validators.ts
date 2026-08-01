import { z } from "zod";

import { PRODUCT_TYPES, STOCK_STATUSES } from "../constants/index.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL safe.");

const imageUrlSchema = z.string().trim().min(1).max(500);
const comboItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().positive(),
});

const seoKeywordsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(20)
  .default([]);

const booleanQuerySchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const lower = val.trim().toLowerCase();
      if (lower === "true" || lower === "1") return true;
      if (lower === "false" || lower === "0") return false;
    }
    return undefined;
  });

const productSchemaBase = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema.optional(),
  shortDescription: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().min(5).max(2000),
  categoryId: objectIdSchema,
  occasionIds: z.array(objectIdSchema).default([]),
  productType: z.enum(PRODUCT_TYPES).default("NORMAL"),
  comboItems: z.array(comboItemSchema).default([]),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().min(0).optional(),
  taxCategory: z.string().trim().min(1).max(80).optional(),
  imageUrls: z.array(imageUrlSchema).max(20).default([]),
  thumbnailUrl: imageUrlSchema,
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  stockStatus: z.enum(STOCK_STATUSES).optional(),
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
  deliveryEligible: z.boolean().default(true),
  pickupEligible: z.boolean().default(true),
  availableFrom: z.coerce.date().optional(),
  availableUntil: z.coerce.date().optional(),
  displayOrder: z.number().int().min(0).default(0),
  seoTitle: z.string().trim().min(2).max(70),
  seoDescription: z.string().trim().min(5).max(160),
  seoKeywords: seoKeywordsSchema,
});

const compareAtPriceRule = (data: {
  price?: number;
  compareAtPrice?: number;
}): boolean => {
  return (
    typeof data.price !== "number" ||
    typeof data.compareAtPrice === "undefined" ||
    data.compareAtPrice >= data.price
  );
};

const availabilityDateRule = (data: {
  availableFrom?: Date;
  availableUntil?: Date;
}): boolean => {
  return (
    !data.availableFrom ||
    !data.availableUntil ||
    data.availableFrom <= data.availableUntil
  );
};

export const createProductSchema = productSchemaBase
  .refine(compareAtPriceRule, {
    message: "Compare-at price must be greater than or equal to price.",
    path: ["compareAtPrice"],
  })
  .refine(availabilityDateRule, {
    message: "Available-from date must be before available-until date.",
    path: ["availableUntil"],
  });

export const updateProductSchema = productSchemaBase
  .partial()
  .refine(compareAtPriceRule, {
    message: "Compare-at price must be greater than or equal to price.",
    path: ["compareAtPrice"],
  })
  .refine(availabilityDateRule, {
    message: "Available-from date must be before available-until date.",
    path: ["availableUntil"],
  });

export const updatePricingSchema = z
  .object({
    price: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    costPrice: z.number().min(0).optional(),
    taxCategory: z.string().trim().min(1).max(80).optional(),
  })
  .refine(compareAtPriceRule, {
    message: "Compare-at price must be greater than or equal to price.",
    path: ["compareAtPrice"],
  });

export const updateInventorySchema = z.object({
  stockQuantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  trackInventory: z.boolean(),
  allowBackorder: z.boolean(),
  stockStatus: z.enum(STOCK_STATUSES).optional(),
});

export const updateAvailabilitySchema = z
  .object({
    isAvailable: z.boolean(),
    deliveryEligible: z.boolean(),
    pickupEligible: z.boolean(),
    availableFrom: z.coerce.date().optional(),
    availableUntil: z.coerce.date().optional(),
  })
  .refine(
    availabilityDateRule,
    {
      message: "Available-from date must be before available-until date.",
      path: ["availableUntil"],
    },
  );

export const publicProductQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum([
        "newest",
        "price_asc",
        "price-asc",
        "price_desc",
        "price-desc",
        "featured",
        "trending",
        "recommended",
        "display_order",
        "displayOrder",
      ])
      .default("display_order"),
    category: z.string().trim().min(1).optional(),
    occasion: z.string().trim().min(1).optional(),
    productType: z.enum(PRODUCT_TYPES).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    isAvailable: booleanQuerySchema,
    isFeatured: booleanQuerySchema,
    isTrending: booleanQuerySchema,
    isSeasonal: booleanQuerySchema,
    isRecommended: booleanQuerySchema,
  })
  .refine(
    (data) =>
      typeof data.minPrice !== "number" ||
      typeof data.maxPrice !== "number" ||
      data.minPrice <= data.maxPrice,
    {
      message: "Minimum price must be less than or equal to maximum price.",
      path: ["maxPrice"],
    },
  );

export const productIdParamSchema = z.object({
  id: objectIdSchema,
});

export const productSlugParamSchema = z.object({
  slug: slugSchema,
});
