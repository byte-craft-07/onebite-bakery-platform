import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../db/schema-options.js";
import type { TimestampedDocument } from "../../db/types/base-document.types.js";

export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "blocked"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User extends TimestampedDocument {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  isVerified: boolean;
  profileImage?: string;
  status: UserStatus;
  lastLogin?: Date;
}

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits."],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email must be valid."],
      default: undefined,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    profileImage: {
      type: String,
      trim: true,
      default: undefined,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "active",
      required: true,
    },
    lastLogin: {
      type: Date,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

// Unique lookup for OTP login and account ownership.
userSchema.index(
  { phone: 1 },
  { unique: true, name: INDEX_NAMES.USER_PHONE_UNIQUE },
);

// Supports future admin/customer filtering without scanning all users.
userSchema.index(
  { role: 1, status: 1 },
  { name: INDEX_NAMES.USER_ROLE_STATUS },
);

export const UserModel = model<User>(
  "User",
  userSchema,
  COLLECTION_NAMES.USERS,
);

