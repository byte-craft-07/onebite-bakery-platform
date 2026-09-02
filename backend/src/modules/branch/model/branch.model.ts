import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export const BRANCH_TYPES = ["MAIN", "FRANCHISE"] as const;
export type BranchType = (typeof BRANCH_TYPES)[number];

export interface BranchAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface Branch extends TimestampedDocument {
  _id: Types.ObjectId;
  name: string;
  code: string;
  type: BranchType;
  address: BranchAddress;
  phone: string;
  email: string;
  managerId?: Types.ObjectId;
  isActive: boolean;
}

const branchAddressSchema = new Schema<BranchAddress>(
  {
    street: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    city: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    state: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{4,10}$/, "Pincode must be 4 to 10 digits."],
    },
    landmark: { type: String, trim: true, maxlength: 150 },
  },
  { _id: false },
);

const branchSchema = new Schema<Branch>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9_-]{3,20}$/, "Branch code must be 3 to 20 uppercase alphanumeric characters."],
    },
    type: {
      type: String,
      enum: BRANCH_TYPES,
      required: true,
      default: "FRANCHISE",
    },
    address: {
      type: branchAddressSchema,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits."],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email must be valid."],
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  baseSchemaOptions,
);

branchSchema.index(
  { code: 1 },
  { unique: true, name: INDEX_NAMES.BRANCH_CODE_UNIQUE },
);

branchSchema.index(
  { type: 1, isActive: 1 },
  { name: INDEX_NAMES.BRANCH_TYPE_STATUS },
);

branchSchema.index(
  { managerId: 1 },
  { name: INDEX_NAMES.BRANCH_MANAGER, sparse: true },
);

export const BranchModel = model<Branch>(
  "Branch",
  branchSchema,
  COLLECTION_NAMES.BRANCHES,
);
