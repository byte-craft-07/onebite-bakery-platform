import { z } from "zod";

import { PRODUCT_TYPES } from "../constants/index.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL safe.");

const imageUrlSchema = z.string().trim().min(1).max(500);

const seoKeywordsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(20)
  .default([]);

const productSchemaBase = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema.optional(),
  shortDescription: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().min(5).max(2000),
  categoryId: objectIdSchema,
  occasionIds: z.array(objectIdSchema).default([]),
  productType: z.enum(PRODUCT_TYPES).default("NORMAL"),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  imageUrls: z.array(imageUrlSchema).max(20).default([]),
  thumbnailUrl: imageUrlSchema,
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
  deliveryEligible: z.boolean().default(true),
  pickupEligible: z.boolean().default(true),
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

export const createProductSchema = productSchemaBase.refine(compareAtPriceRule, {
  message: "Compare-at price must be greater than or equal to price.",
  path: ["compareAtPrice"],
});

export const updateProductSchema = productSchemaBase
  .partial()
  .refine(compareAtPriceRule, {
    message: "Compare-at price must be greater than or equal to price.",
    path: ["compareAtPrice"],
  });

export const productIdParamSchema = z.object({
  id: objectIdSchema,
});

export const productSlugParamSchema = z.object({
  slug: slugSchema,
});
