import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

export const mediaIdParamSchema = z.object({
  id: objectIdSchema,
});

export const uploadMediaBodySchema = z.object({
  altText: z.string().trim().max(300).optional(),
  tags: z
    .union([
      z.array(z.string().trim().min(1).max(50)),
      z.string().transform((str) =>
        str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ])
    .optional(),
});

export const listMediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  mimeType: z.string().trim().optional(),
  tag: z.string().trim().optional(),
});
