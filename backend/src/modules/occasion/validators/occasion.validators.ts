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
  name: z.string().trim().min(1).max(120),
  slug: slugSchema.optional(),
  description: z.string().trim().min(1).max(1000).optional().default("Celebration occasion cakes and desserts from The Online Bakery."),
  bannerImage: z.string().trim().min(1).optional().default("https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80"),
  icon: z.string().trim().min(1).max(120).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().trim().min(1).max(70).optional(),
  seoDescription: z.string().trim().min(1).max(160).optional(),
  seoKeywords: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});

export const updateOccasionSchema = createOccasionSchema.partial();
