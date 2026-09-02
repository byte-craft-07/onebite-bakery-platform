import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface BranchProduct extends TimestampedDocument {
  _id: Types.ObjectId;
  branchId: Types.ObjectId;
  productId: Types.ObjectId;
  isAvailable: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const branchProductSchema = new Schema<BranchProduct>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    isAvailable: {
      type: Boolean,
      required: true,
      default: true,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    allowBackorder: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
  },
  baseSchemaOptions,
);

// Enforce single override record per (branch, product)
branchProductSchema.index(
  { branchId: 1, productId: 1 },
  { unique: true, name: INDEX_NAMES.BRANCH_PRODUCT_UNIQUE },
);

// Support querying branch product availability
branchProductSchema.index(
  { branchId: 1, isAvailable: 1 },
  { name: INDEX_NAMES.BRANCH_PRODUCT_BRANCH },
);

// Support querying product availability across branches
branchProductSchema.index(
  { productId: 1, isAvailable: 1 },
  { name: INDEX_NAMES.BRANCH_PRODUCT_PRODUCT },
);

export const BranchProductModel = model<BranchProduct>(
  "BranchProduct",
  branchProductSchema,
  COLLECTION_NAMES.BRANCH_PRODUCTS,
);
