import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface DecorationWeightOption {
  weight: string;
  serves?: string;
  price: number;
  compareAtPrice?: number;
}

export interface Decoration extends TimestampedDocument {
  _id: Types.ObjectId;
  name: string;
  nameHi?: string;
  slug: string;
  category: string;
  price: number;
  originalPrice: number;
  sku?: string;
  unit?: string;
  stockQuantity?: number;
  rating: number;
  image: string;
  images?: string[];
  description: string;
  descriptionHi?: string;
  inStock: boolean;
  isActive: boolean;
  isComingSoon?: boolean;
  isInstantAvailable?: boolean;
  isEggless?: boolean;
  weightOptions?: DecorationWeightOption[];
  displayOrder: number;
}

const decorationSchema = new Schema<Decoration>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameHi: {
      type: String,
      trim: true,
      default: undefined,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "Party Accessories",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
      default: undefined,
    },
    unit: {
      type: String,
      trim: true,
      default: undefined,
    },
    stockQuantity: {
      type: Number,
      min: 0,
      default: 50,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.8,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionHi: {
      type: String,
      trim: true,
      default: undefined,
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isComingSoon: {
      type: Boolean,
      default: false,
    },
    isInstantAvailable: {
      type: Boolean,
      default: true,
    },
    isEggless: {
      type: Boolean,
      default: true,
    },
    weightOptions: {
      type: [
        {
          weight: { type: String, required: true },
          serves: { type: String },
          price: { type: Number, required: true },
          compareAtPrice: { type: Number },
        },
      ],
      default: undefined,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  baseSchemaOptions,
);

decorationSchema.index({ slug: 1 });
decorationSchema.index({ category: 1, isActive: 1, displayOrder: 1 });

export const DecorationModel = model<Decoration>(
  "Decoration",
  decorationSchema,
  COLLECTION_NAMES.DECORATIONS,
);
