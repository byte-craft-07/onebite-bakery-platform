import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface Occasion extends TimestampedDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  bannerImage: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

const occasionSchema = new Schema<Occasion>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL safe."],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
    bannerImage: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      maxlength: 120,
      default: undefined,
    },
    displayOrder: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    seoTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 70,
    },
    seoDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 160,
    },
    seoKeywords: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator(value: string[]): boolean {
          return value.length <= 20;
        },
        message: "SEO keywords cannot exceed 20 items.",
      },
    },
  },
  baseSchemaOptions,
);

// Canonical occasion URL lookup and duplicate-slug prevention.
occasionSchema.index(
  { slug: 1 },
  { unique: true, name: INDEX_NAMES.OCCASION_SLUG_UNIQUE },
);

// Supports owner ordering and public occasion navigation.
occasionSchema.index(
  { displayOrder: 1 },
  { name: INDEX_NAMES.OCCASION_DISPLAY_ORDER },
);

// Supports public active-occasion listing.
occasionSchema.index(
  { isActive: 1 },
  { name: INDEX_NAMES.OCCASION_ACTIVE },
);

export const OccasionModel = model<Occasion>(
  "Occasion",
  occasionSchema,
  COLLECTION_NAMES.OCCASIONS,
);
