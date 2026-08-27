import { model, Schema, type Types } from "mongoose";

import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";
import {
  NOTIFICATION_PROVIDERS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  type NotificationProviderType,
  type NotificationStatus,
  type NotificationType,
} from "../constants/index.js";

export interface Notification extends TimestampedDocument {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  type: NotificationType;
  provider: NotificationProviderType;
  template: string;
  subject: string;
  recipient: string;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  retryCount: number;
  providerMessageId?: string;
  failureReason?: string;
  sentAt?: Date;
}

const notificationSchema = new Schema<Notification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: NOTIFICATION_PROVIDERS,
      default: "EMAIL",
    },
    template: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: NOTIFICATION_STATUSES,
      default: "PENDING",
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    retryCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    providerMessageId: {
      type: String,
      trim: true,
      default: undefined,
    },
    failureReason: {
      type: String,
      trim: true,
      default: undefined,
    },
    sentAt: {
      type: Date,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

export const NotificationModel = model<Notification>(
  "Notification",
  notificationSchema,
  "notifications",
);
