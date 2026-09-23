import { z } from "zod";

export const loginWithPasswordSchema = z.object({
  identifier: z.string().trim().min(3, "Identifier must be at least 3 characters."),
  password: z.string().trim().min(1, "Password is required."),
});
