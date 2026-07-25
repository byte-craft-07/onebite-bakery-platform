import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../../../config/env.js";

const OTP_HASH_ALGORITHM = "sha256";
const HASH_ENCODING = "hex";

export const createOtpHash = (otp: string): string => {
  return createHmac(OTP_HASH_ALGORITHM, env.otpHashSecret)
    .update(otp)
    .digest(HASH_ENCODING);
};

export const compareOtpHash = (otp: string, otpHash: string): boolean => {
  const candidateHash = createOtpHash(otp);
  const candidateBuffer = Buffer.from(candidateHash, HASH_ENCODING);
  const storedBuffer = Buffer.from(otpHash, HASH_ENCODING);

  if (candidateBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, storedBuffer);
};
