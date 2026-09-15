import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export const USER_ROLES = ["customer", "admin", "branch_admin", "delivery_agent"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "blocked"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_PROVIDERS = ["phone", "google"] as const;
export type AuthProviderType = (typeof AUTH_PROVIDERS)[number];

export interface CustomerLocation {
  villageId: Types.ObjectId;
  villageName: string;
  district: string;
  pincode: string;
}

export interface User extends TimestampedDocument {
  _id: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  googleId?: string;
  authProviders?: AuthProviderType[];
  password?: string;
  role: UserRole;
  branchId?: Types.ObjectId;
  currentLocation?: CustomerLocation;
  isVerified: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: Date;
  profileImage?: string;
  status: UserStatus;
  lastLogin?: Date;
}

const customerLocationSchema = new Schema<CustomerLocation>(
  {
    villageId: {
      type: Schema.Types.ObjectId,
      ref: "Village",
      required: true,
    },
    villageName: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

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
      required: false,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits."],
      default: undefined,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email must be valid."],
      default: undefined,
    },
    googleId: {
      type: String,
      trim: true,
      default: undefined,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    authProviders: {
      type: [String],
      enum: AUTH_PROVIDERS,
      default: ["phone"],
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: undefined,
      required: false,
    },
    currentLocation: {
      type: customerLocationSchema,
      default: undefined,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
      required: false,
    },
    phoneVerifiedAt: {
      type: Date,
      default: undefined,
      required: false,
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

// Sparse unique lookup for OTP login and phone ownership.
userSchema.index(
  { phone: 1 },
  { unique: true, sparse: true, name: INDEX_NAMES.USER_PHONE_UNIQUE },
);

// Sparse unique lookup for Google login.
userSchema.index(
  { googleId: 1 },
  { unique: true, sparse: true, name: INDEX_NAMES.USER_GOOGLE_ID_UNIQUE },
);

// Email lookup for account linking.
userSchema.index(
  { email: 1 },
  { sparse: true, name: INDEX_NAMES.USER_EMAIL },
);

// Supports future admin/customer filtering without scanning all users.
userSchema.index(
  { role: 1, status: 1 },
  { name: INDEX_NAMES.USER_ROLE_STATUS },
);

// Branch assignment lookup index.
userSchema.index(
  { branchId: 1 },
  { name: INDEX_NAMES.USER_BRANCH, sparse: true },
);

// Customer active location lookup index.
userSchema.index(
  { "currentLocation.villageId": 1 },
  { name: INDEX_NAMES.USER_CURRENT_LOCATION, sparse: true },
);

export const UserModel = model<User>(
  "User",
  userSchema,
  COLLECTION_NAMES.USERS,
);
