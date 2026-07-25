import { OTP_CONSTANTS } from "../constants/otp.constants.js";

export const createOtpExpiry = (now = new Date()): Date => {
  return new Date(now.getTime() + OTP_CONSTANTS.EXPIRY_MS);
};

export const isOtpCooldownActive = (
  lastSentAt: Date,
  now = new Date(),
): boolean => {
  return now.getTime() - lastSentAt.getTime() < OTP_CONSTANTS.COOLDOWN_MS;
};
