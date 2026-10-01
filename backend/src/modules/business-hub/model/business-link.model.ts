import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export const LINK_TYPES = [
  "WEBSITE",
  "WHATSAPP",
  "PHONE",
  "MAP",
  "INSTAGRAM",
  "FACEBOOK",
  "YOUTUBE",
  "EMAIL",
  "CUSTOM",
  "PRODUCT",
  "CATEGORY",
  "ABOUT",
  "REVIEWS",
] as const;

export type LinkType = (typeof LINK_TYPES)[number];

export interface BusinessLink extends TimestampedDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: LinkType;
  url: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  openInNewTab: boolean;
  sortOrder: number;
  clickCount: number;
}

const businessLinkSchema = new Schema<BusinessLink>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },
    type: {
      type: String,
      required: true,
      enum: LINK_TYPES,
      default: "CUSTOM",
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
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
    openInNewTab: {
      type: Boolean,
      required: true,
      default: true,
    },
    sortOrder: {
      type: Number,
      required: true,
      default: 0,
    },
    clickCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  baseSchemaOptions,
);

businessLinkSchema.index(
  { sortOrder: 1 },
  { name: INDEX_NAMES.BUSINESS_LINK_SORT_ORDER },
);

businessLinkSchema.index(
  { isActive: 1, sortOrder: 1 },
  { name: INDEX_NAMES.BUSINESS_LINK_ACTIVE },
);

export const BusinessLinkModel = model<BusinessLink>(
  "BusinessLink",
  businessLinkSchema,
  COLLECTION_NAMES.BUSINESS_LINKS,
);
