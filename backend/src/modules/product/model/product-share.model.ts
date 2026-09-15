import { model, Schema, type Types } from "mongoose";

import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export type ShareMethod =
  | "native"
  | "whatsapp"
  | "whatsapp_status"
  | "instagram_story"
  | "telegram"
  | "facebook"
  | "x"
  | "copy_link";

export const ALLOWED_SHARE_METHODS: ShareMethod[] = [
  "native",
  "whatsapp",
  "whatsapp_status",
  "instagram_story",
  "telegram",
  "facebook",
  "x",
  "copy_link",
];

export interface ProductShareEvent extends TimestampedDocument {
  _id: Types.ObjectId;
  productId?: Types.ObjectId;
  productSlug: string;
  productName?: string;
  shareMethod: ShareMethod;
}

const productShareSchema = new Schema<ProductShareEvent>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: undefined,
    },
    productSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    productName: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    shareMethod: {
      type: String,
      required: true,
      enum: ALLOWED_SHARE_METHODS,
    },
  },
  baseSchemaOptions,
);

productShareSchema.index({ productSlug: 1, createdAt: -1 });
productShareSchema.index({ shareMethod: 1, createdAt: -1 });

export const ProductShareModel = model<ProductShareEvent>(
  "ProductShareEvent",
  productShareSchema,
  "product_shares",
);
