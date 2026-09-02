import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export type CustomCakeInquiryStatus =
  | "PENDING"
  | "REVIEWED"
  | "QUOTED"
  | "ACCEPTED"
  | "REJECTED"
  | "CONVERTED";

export interface CustomCakeInquiry extends TimestampedDocument {
  _id: Types.ObjectId;
  inquiryNumber: string;
  userId?: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tiers: number;
  shape?: string;
  flavor?: string;
  designTheme?: string;
  weightKg?: number;
  isEggless: boolean;
  cakeMessage?: string;
  queryText: string;
  referenceImageUrl?: string;
  estimatedPrice?: number;
  budgetRange?: string;
  eventDate?: Date;
  occasion?: string;
  status: CustomCakeInquiryStatus;
  adminNotes?: string;
  adminRecommendation?: {
    recommendedProductId?: Types.ObjectId;
    recommendedCakeTitle?: string;
    quotedPrice?: number;
    message?: string;
    recommendedAt?: Date;
  };
}

const customCakeInquirySchema = new Schema<CustomCakeInquiry>(
  {
    inquiryNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAMES.USERS,
      default: undefined,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      default: "",
    },
    tiers: {
      type: Number,
      default: 1,
    },
    shape: {
      type: String,
      trim: true,
      default: "Round",
    },
    flavor: {
      type: String,
      trim: true,
      default: "",
    },
    designTheme: {
      type: String,
      trim: true,
      default: "",
    },
    weightKg: {
      type: Number,
      default: 1.5,
    },
    isEggless: {
      type: Boolean,
      default: true,
    },
    cakeMessage: {
      type: String,
      trim: true,
      default: "",
    },
    queryText: {
      type: String,
      required: true,
      trim: true,
    },
    referenceImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    estimatedPrice: {
      type: Number,
      default: 0,
    },
    budgetRange: {
      type: String,
      trim: true,
      default: "",
    },
    eventDate: {
      type: Date,
      default: undefined,
    },
    occasion: {
      type: String,
      trim: true,
      default: "Birthday",
    },
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "QUOTED", "ACCEPTED", "REJECTED", "CONVERTED"],
      default: "PENDING",
      required: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    adminRecommendation: {
      recommendedProductId: {
        type: Schema.Types.ObjectId,
        ref: COLLECTION_NAMES.PRODUCTS,
        default: undefined,
      },
      recommendedCakeTitle: {
        type: String,
        trim: true,
        default: "",
      },
      quotedPrice: {
        type: Number,
        default: undefined,
      },
      message: {
        type: String,
        trim: true,
        default: "",
      },
      recommendedAt: {
        type: Date,
        default: undefined,
      },
    },
  },
  baseSchemaOptions,
);

customCakeInquirySchema.index({ inquiryNumber: 1 }, { unique: true });
customCakeInquirySchema.index({ status: 1, createdAt: -1 });
customCakeInquirySchema.index({ customerPhone: 1 });
customCakeInquirySchema.index({ userId: 1 });

export const CustomCakeInquiryModel = model<CustomCakeInquiry>(
  "CustomCakeInquiry",
  customCakeInquirySchema,
  COLLECTION_NAMES.CUSTOM_CAKE_INQUIRIES,
);
