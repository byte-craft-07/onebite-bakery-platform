import { z } from "zod";

import { PRODUCT_TYPES } from "../../product/constants/index.js";

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

export const searchQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    query: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum([
        "newest",
        "relevance",
        "price_asc",
        "price-asc",
        "price_desc",
        "price-desc",
        "featured",
        "trending",
        "recommended",
        "popular",
        "alphabetical",
      ])
      .default("relevance"),
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
