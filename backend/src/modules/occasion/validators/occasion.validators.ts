import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL safe.");

export const occasionIdParamSchema = z.object({
  id: objectIdSchema,
});

export const occasionSlugParamSchema = z.object({
  slug: slugSchema,
});

export const createOccasionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().min(5).max(1000),
  bannerImage: z.string().trim().min(1).max(500),
  icon: z.string().trim().min(1).max(120).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().trim().min(2).max(70),
  seoDescription: z.string().trim().min(5).max(160),
  seoKeywords: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});

export const updateOccasionSchema = createOccasionSchema.partial();
