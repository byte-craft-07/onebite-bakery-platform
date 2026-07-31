import { model, Schema, type Types } from "mongoose";

import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface ActivityLog extends TimestampedDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const activityLogSchema = new Schema<ActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: undefined,
    },
    userAgent: {
      type: String,
      trim: true,
      default: undefined,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

export const ActivityLogModel = model<ActivityLog>(
  "ActivityLog",
  activityLogSchema,
  "activity_logs",
);
