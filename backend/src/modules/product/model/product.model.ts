import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { softDeleteSchemaFields } from "../../../db/schema-fields.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type {
  SoftDeletableDocument,
  TimestampedDocument,
} from "../../../db/types/base-document.types.js";
import { PRODUCT_TYPES, type ProductType } from "../constants/index.js";

export interface ComboItem {
  productId: Types.ObjectId;
  quantity: number;
}

export interface Product extends TimestampedDocument, SoftDeletableDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: Types.ObjectId;
  productType: ProductType;
  occasionIds: Types.ObjectId[];
  comboItems: ComboItem[];
  price: number;
  compareAtPrice?: number;
  imageUrls: string[];
  thumbnailUrl: string;
  deliveryEligible: boolean;
  pickupEligible: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isRecommended: boolean;
  isSeasonal: boolean;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const comboItemSchema = new Schema<ComboItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false },
);

const productSchema = new Schema<Product>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
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
      maxlength: 2000,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
      default: undefined,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    productType: {
      type: String,
      enum: PRODUCT_TYPES,
      required: true,
      default: "NORMAL",
    },
    occasionIds: {
      type: [Schema.Types.ObjectId],
      ref: "Occasion",
      default: [],
    },
    comboItems: {
      type: [comboItemSchema],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: undefined,
    },
    imageUrls: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator(value: string[]): boolean {
          return value.length <= 20;
        },
        message: "Product image URLs cannot exceed 20 items.",
      },
    },
    thumbnailUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    deliveryEligible: {
      type: Boolean,
      required: true,
      default: true,
    },
    pickupEligible: {
      type: Boolean,
      required: true,
      default: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      required: true,
      default: false,
    },
    isTrending: {
      type: Boolean,
      required: true,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      required: true,
      default: false,
    },
    isSeasonal: {
      type: Boolean,
      required: true,
      default: false,
    },
    displayOrder: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
    ...softDeleteSchemaFields,
  },
  baseSchemaOptions,
);

// Canonical product URL lookup and duplicate-slug prevention.
productSchema.index(
  { slug: 1 },
  { unique: true, name: INDEX_NAMES.PRODUCT_SLUG_UNIQUE },
);

// Supports category-based product listing.
productSchema.index(
  { categoryId: 1 },
  { name: INDEX_NAMES.PRODUCT_CATEGORY },
);

// Supports filtering normal, combo, and custom-cake products.
productSchema.index(
  { productType: 1 },
  { name: INDEX_NAMES.PRODUCT_TYPE },
);

// Supports future shop-by-occasion product listing.
productSchema.index(
  { occasionIds: 1 },
  { name: INDEX_NAMES.PRODUCT_OCCASIONS },
);

// Supports public active product listing.
productSchema.index(
  { isActive: 1, isDeleted: 1 },
  { name: INDEX_NAMES.PRODUCT_ACTIVE },
);

export const ProductModel = model<Product>(
  "Product",
  productSchema,
  COLLECTION_NAMES.PRODUCTS,
);
