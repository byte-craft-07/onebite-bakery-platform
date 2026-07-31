import { z } from "zod";

import { MEDIA_ENTITY_TYPES } from "../constants/index.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

export const mediaIdParamSchema = z.object({
  id: objectIdSchema,
});

export const uploadMediaBodySchema = z.object({
  entityType: z.enum(MEDIA_ENTITY_TYPES),
  entityId: z.string().trim().optional(),
});
