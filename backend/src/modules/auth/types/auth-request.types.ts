import type { Request } from "express";

import type { AuthenticatedUser } from "./auth-token.types.js";

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  accessToken: string;
}
