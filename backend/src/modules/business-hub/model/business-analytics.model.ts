import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export type AnalyticsEventType =
  | "page_view"
  | "order_website"
  | "whatsapp"
  | "call"
  | "map"
  | "instagram"
  | "custom_link"
  | "share";

export interface BusinessAnalyticsEvent extends TimestampedDocument {
  _id: Types.ObjectId;
  linkId?: Types.ObjectId;
  eventType: AnalyticsEventType;
  deviceType: "mobile" | "tablet" | "desktop";
  referrer?: string;
}

const businessAnalyticsSchema = new Schema<BusinessAnalyticsEvent>(
  {
    linkId: {
      type: Schema.Types.ObjectId,
      ref: "BusinessLink",
      default: null,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "page_view",
        "order_website",
        "whatsapp",
        "call",
        "map",
        "instagram",
        "custom_link",
        "share",
      ],
    },
    deviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "mobile",
    },
    referrer: {
      type: String,
      trim: true,
      default: "",
    },
  },
  baseSchemaOptions,
);

businessAnalyticsSchema.index(
  { createdAt: -1 },
  { name: INDEX_NAMES.BUSINESS_ANALYTICS_TIMESTAMP },
);

businessAnalyticsSchema.index(
  { eventType: 1, createdAt: -1 },
  { name: INDEX_NAMES.BUSINESS_ANALYTICS_TARGET },
);

export const BusinessAnalyticsModel = model<BusinessAnalyticsEvent>(
  "BusinessAnalytics",
  businessAnalyticsSchema,
  COLLECTION_NAMES.BUSINESS_ANALYTICS,
);
