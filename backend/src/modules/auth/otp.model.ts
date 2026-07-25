import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../db/schema-options.js";
import type { TimestampedDocument } from "../../db/types/base-document.types.js";

export const OTP_PURPOSES = ["login", "admin_login"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export interface Otp extends TimestampedDocument {
  _id: Types.ObjectId;
  phone: string;
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  resendCount: number;
  lastSentAt: Date;
  isUsed: boolean;
  ipAddress?: string;
  userAgent?: string;
}

const otpSchema = new Schema<Otp>(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits."],
    },
    purpose: {
      type: String,
      enum: OTP_PURPOSES,
      default: "login",
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    resendCount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: undefined,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

// Finds the latest OTP challenge for a phone and purpose.
otpSchema.index(
  { phone: 1, purpose: 1, createdAt: -1 },
  { name: INDEX_NAMES.OTP_PHONE_PURPOSE },
);

// Automatically removes expired OTP challenges.
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: INDEX_NAMES.OTP_EXPIRES_AT_TTL },
);

export const OtpModel = model<Otp>("Otp", otpSchema, COLLECTION_NAMES.OTPS);

