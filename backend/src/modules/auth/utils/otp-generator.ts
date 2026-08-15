import { randomInt } from "node:crypto";

import { env } from "../../../config/env.js";
import { OTP_CONSTANTS } from "../constants/otp.constants.js";

export const generateOtp = (): string => {
  if (env.nodeEnv !== "production") {
    return "123456";
  }

  const max = 10 ** OTP_CONSTANTS.LENGTH;

  return randomInt(0, max).toString().padStart(OTP_CONSTANTS.LENGTH, "0");
};
