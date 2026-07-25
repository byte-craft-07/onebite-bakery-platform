import { createHmac } from "node:crypto";

import { env } from "../../../config/env.js";

const TOKEN_HASH_ALGORITHM = "sha256";

export const createRefreshTokenHash = (refreshToken: string): string => {
  return createHmac(TOKEN_HASH_ALGORITHM, env.jwtRefreshSecret)
    .update(refreshToken)
    .digest("hex");
};
