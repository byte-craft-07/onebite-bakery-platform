import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface Review extends TimestampedDocument {
  _id: Types.ObjectId;
  customerName: string;
  avatar?: string;
  rating: number;
  qualityRating?: number;
  tasteRating?: number;
  comment: string;
  productName?: string;
  productId?: string;
  orderId?: string;
  tags: string[];
  isVerified: boolean;
  isActive: boolean;
}

const reviewSchema = new Schema<Review>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: "Verified Customer",
    },
    avatar: {
      type: String,
      trim: true,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    tasteRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    productName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: undefined,
    },
    productId: {
      type: String,
      trim: true,
      default: undefined,
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      default: undefined,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  baseSchemaOptions,
);

reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isActive: 1, createdAt: -1 });

export const ReviewModel = model<Review>(
  "Review",
  reviewSchema,
  COLLECTION_NAMES.REVIEWS,
);
