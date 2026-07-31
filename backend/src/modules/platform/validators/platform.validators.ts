import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

export const platformLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  userId: objectIdSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
