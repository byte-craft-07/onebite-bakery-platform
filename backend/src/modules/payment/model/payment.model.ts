import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_RECORD_STATUSES,
  type PaymentProviderType,
  type PaymentRecordStatus,
} from "../constants/index.js";

export interface Payment extends TimestampedDocument {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  provider: PaymentProviderType;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentRecordStatus;
  paymentMethod?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

const paymentSchema = new Schema<Payment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: PAYMENT_PROVIDERS,
      default: "RAZORPAY",
    },
    providerOrderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
      trim: true,
      default: undefined,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      default: "INR",
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: PAYMENT_RECORD_STATUSES,
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: undefined,
    },
    failureReason: {
      type: String,
      trim: true,
      default: undefined,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

export const PaymentModel = model<Payment>(
  "Payment",
  paymentSchema,
  COLLECTION_NAMES.MEDIA ? "payments" : "payments",
);
