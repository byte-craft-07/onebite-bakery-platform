import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface Combo extends TimestampedDocument {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  items: string[];
  price: number;
  originalPrice: number;
  image: string;
  images?: string[];
  badge?: string;
  isActive: boolean;
  isAvailable: boolean;
  displayOrder: number;
}

const comboSchema = new Schema<Combo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    items: {
      type: [String],
      required: true,
      default: [],
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
    image: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      trim: true,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      required: true,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  baseSchemaOptions,
);

comboSchema.index({ slug: 1 }, { unique: true });
comboSchema.index({ isActive: 1, displayOrder: 1 });

export const ComboModel = model<Combo>(
  "Combo",
  comboSchema,
  COLLECTION_NAMES.COMBOS,
);
