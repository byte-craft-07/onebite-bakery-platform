import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface Banner extends TimestampedDocument {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  description?: string;
  desktopImage: string;
  mobileImage?: string;
  linkUrl: string;
  buttonText?: string;
  badgeText?: string;
  bgGradient?: string;
  displayOrder: number;
  isActive: boolean;
  placement: "home_hero" | "promo_strip" | "category_top";
  startDate?: Date;
  endDate?: Date;
}

const bannerSchema = new Schema<Banner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 200,
      default: undefined,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    desktopImage: {
      type: String,
      required: true,
      trim: true,
    },
    mobileImage: {
      type: String,
      trim: true,
      default: undefined,
    },
    linkUrl: {
      type: String,
      required: true,
      trim: true,
      default: "/products",
    },
    buttonText: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "Explore All Products",
    },
    badgeText: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "Freshly Baked Daily",
    },
    bgGradient: {
      type: String,
      trim: true,
      default: "from-[#FFF3E6] via-[#FFFBF5] to-[#F9F6F0]",
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
    placement: {
      type: String,
      enum: ["home_hero", "promo_strip", "category_top"],
      default: "home_hero",
    },
    startDate: {
      type: Date,
      default: undefined,
    },
    endDate: {
      type: Date,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

// Sorting index for displaying banners in display order
bannerSchema.index(
  { displayOrder: 1 },
  { name: INDEX_NAMES.BANNER_DISPLAY_ORDER },
);

// Filtering index for fetching active banners
bannerSchema.index(
  { isActive: 1, placement: 1, displayOrder: 1 },
  { name: INDEX_NAMES.BANNER_ACTIVE },
);

export const BannerModel = model<Banner>(
  "Banner",
  bannerSchema,
  COLLECTION_NAMES.BANNERS,
);
