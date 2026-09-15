import { model, Schema, type Types } from "mongoose";

import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscription extends TimestampedDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  endpoint: string;
  keys: PushSubscriptionKeys;
  deviceInfo?: Record<string, unknown>;
  userAgent?: string;
  isActive: boolean;
  lastUsedAt?: Date;
}

const pushSubscriptionKeysSchema = new Schema<PushSubscriptionKeys>(
  {
    p256dh: {
      type: String,
      required: true,
      trim: true,
    },
    auth: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const pushSubscriptionSchema = new Schema<PushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    keys: {
      type: pushSubscriptionKeysSchema,
      required: true,
    },
    deviceInfo: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    userAgent: {
      type: String,
      trim: true,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

pushSubscriptionSchema.index({ userId: 1, isActive: 1 });

export const PushSubscriptionModel = model<PushSubscription>(
  "PushSubscription",
  pushSubscriptionSchema,
  "push_subscriptions",
);
