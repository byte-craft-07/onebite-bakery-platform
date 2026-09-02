import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

import { INDEX_NAMES } from "../../../db/constants/index-names.js";

export interface Village extends TimestampedDocument {
  _id: Types.ObjectId;
  name: string;
  district: string;
  pincode: string;
  isActive: boolean;
  branchId?: Types.ObjectId | null;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
}

const villageSchema = new Schema<Village>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{4,10}$/, "Pincode must be 4 to 10 digits."],
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      required: false,
    },
    deliveryCharge: {
      type: Number,
      default: 49,
      min: 0,
      required: false,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 799,
      min: 0,
      required: false,
    },
  },
  baseSchemaOptions,
);

villageSchema.index({ name: 1, district: 1 });
villageSchema.index({ isActive: 1 });
villageSchema.index(
  { branchId: 1 },
  { name: INDEX_NAMES.VILLAGE_BRANCH, sparse: true },
);

export const VillageModel = model<Village>(
  "Village",
  villageSchema,
  COLLECTION_NAMES.VILLAGES,
);
