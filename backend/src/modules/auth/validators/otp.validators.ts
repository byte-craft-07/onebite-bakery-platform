import { z } from "zod";

import { OTP_CONSTANTS } from "../constants/otp.constants.js";
import { OTP_PURPOSES } from "../model/index.js";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits.");

const purposeSchema = z.enum(OTP_PURPOSES).default("login");

export const sendOtpSchema = z.object({
  phone: phoneSchema,
  purpose: purposeSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  purpose: purposeSchema,
  otp: z
    .string()
    .trim()
    .regex(
      new RegExp(`^[0-9]{${OTP_CONSTANTS.LENGTH}}$`),
      `OTP must be ${OTP_CONSTANTS.LENGTH} digits.`,
    ),
});
