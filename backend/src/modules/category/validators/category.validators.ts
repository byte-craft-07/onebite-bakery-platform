import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid category id.");

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL safe.");

const parentCategorySchema = z
  .union([objectIdSchema, z.null()])
  .optional()
  .transform((value) => value ?? null);

const seoKeywordsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(20)
  .default([]);

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().min(5).max(1000),
  image: z.string().trim().min(1).max(500),
  icon: z.string().trim().min(1).max(120).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  parentCategory: parentCategorySchema,
  seoTitle: z.string().trim().min(2).max(70),
  seoDescription: z.string().trim().min(5).max(160),
  seoKeywords: seoKeywordsSchema,
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryIdParamSchema = z.object({
  id: objectIdSchema,
});

export const reorderCategoriesSchema = z.object({
  items: z
    .array(
      z.object({
        id: objectIdSchema,
        displayOrder: z.number().int().min(0),
        parentCategory: parentCategorySchema,
      }),
    )
    .min(1)
    .max(200),
});
