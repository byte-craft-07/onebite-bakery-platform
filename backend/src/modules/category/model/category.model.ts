import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { softDeleteSchemaFields } from "../../../db/schema-fields.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type {
  SoftDeletableDocument,
  TimestampedDocument,
} from "../../../db/types/base-document.types.js";

export interface Category extends TimestampedDocument, SoftDeletableDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  parentCategory?: Types.ObjectId;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  searchableText: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const categorySchema = new Schema<Category>(
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
      minlength: 5,
      maxlength: 1000,
    },
    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
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
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: undefined,
    },
    seoTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 70,
    },
    seoDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
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
    searchableText: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
    ...softDeleteSchemaFields,
  },
  baseSchemaOptions,
);

// Canonical URL lookup and duplicate-slug prevention.
categorySchema.index(
  { slug: 1 },
  { unique: true, name: INDEX_NAMES.CATEGORY_SLUG_UNIQUE },
);

// Builds category trees without scanning the whole collection for child lookups.
categorySchema.index(
  { parentCategory: 1 },
  { name: INDEX_NAMES.CATEGORY_PARENT },
);

// Supports public and admin ordering.
categorySchema.index(
  { displayOrder: 1 },
  { name: INDEX_NAMES.CATEGORY_DISPLAY_ORDER },
);

// Supports public active-category listing.
categorySchema.index(
  { isActive: 1, isDeleted: 1 },
  { name: INDEX_NAMES.CATEGORY_ACTIVE },
);

export const CategoryModel = model<Category>(
  "Category",
  categorySchema,
  COLLECTION_NAMES.CATEGORIES,
);
