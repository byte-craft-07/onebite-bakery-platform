import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export type CustomCakeOptionType = "FLAVOR" | "DESIGN" | "SHAPE" | "TIER";

export interface CustomCakeOption extends TimestampedDocument {
  _id: Types.ObjectId;
  name: string;
  type: CustomCakeOptionType;
  slug: string;
  description?: string;
  priceModifier: number; // For flavor: base price per kg; for design: extra surcharge; for tier: multiplier
  category?: string; // e.g. "Chocolate", "Fruit", "Luxury", "Kids"
  imageUrl?: string;
  colorCode?: string; // Hex color code for preview
  isActive: boolean;
  displayOrder: number;
}

const customCakeOptionSchema = new Schema<CustomCakeOption>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["FLAVOR", "DESIGN", "SHAPE", "TIER"],
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    priceModifier: {
      type: Number,
      required: true,
      default: 0,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    colorCode: {
      type: String,
      trim: true,
      default: "#E67E22",
    },
    isActive: {
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

customCakeOptionSchema.index({ type: 1, isActive: 1, displayOrder: 1 });
customCakeOptionSchema.index({ slug: 1, type: 1 }, { unique: true });

export const CustomCakeOptionModel = model<CustomCakeOption>(
  "CustomCakeOption",
  customCakeOptionSchema,
  COLLECTION_NAMES.CUSTOM_CAKE_OPTIONS,
);
