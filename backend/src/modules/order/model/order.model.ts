import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";
import type { ProductType } from "../../product/constants/index.js";
import type { CustomCakeConfig } from "../../cart/model/index.js";
import {
  DELIVERY_METHODS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentStatus,
} from "../constants/index.js";

export interface OrderItemSnapshot {
  productId: Types.ObjectId;
  productName: string;
  slug: string;
  categoryName?: string;
  occasionName?: string;
  productType: ProductType;
  image?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  selectedVariant?: Record<string, unknown>;
  customCakeConfig?: CustomCakeConfig;
  notes?: string;
}

export interface OrderAddressSnapshot {
  addressId?: Types.ObjectId;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderPricingSnapshot {
  subtotal: number;
  tax: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
  homeDeliveryAvailable: boolean;
  pickupAvailable: boolean;
}

export interface Order extends TimestampedDocument {
  _id: Types.ObjectId;
  orderNumber: string;
  customerId: Types.ObjectId;
  items: OrderItemSnapshot[];
  addressSnapshot?: OrderAddressSnapshot;
  pricingSnapshot: OrderPricingSnapshot;
  deliveryMethod: DeliveryMethod;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  estimatedReadyTime?: Date;
  scheduledDate?: Date;
  scheduledTimeSlot?: string;
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
}

const customCakeConfigSchema = new Schema<CustomCakeConfig>(
  {
    flavour: { type: String, trim: true, default: undefined },
    weightKg: { type: Number, min: 0.25, max: 20, default: undefined },
    tierCount: { type: Number, min: 1, max: 5, default: undefined },
    eggPreference: {
      type: String,
      enum: ["EGG", "EGGLESS"],
      default: undefined,
    },
    messageOnCake: { type: String, trim: true, maxlength: 100, default: undefined },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
  },
  { _id: false },
);

const orderItemSnapshotSchema = new Schema<OrderItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    categoryName: { type: String, trim: true, default: undefined },
    occasionName: { type: String, trim: true, default: undefined },
    productType: {
      type: String,
      required: true,
      enum: ["NORMAL", "COMBO", "CUSTOM_CAKE", "DECORATION"],
    },
    image: { type: String, trim: true, default: undefined },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    selectedVariant: { type: Schema.Types.Mixed, default: undefined },
    customCakeConfig: { type: customCakeConfigSchema, default: undefined },
    notes: { type: String, trim: true, maxlength: 300, default: undefined },
  },
  { _id: false },
);

const orderAddressSnapshotSchema = new Schema<OrderAddressSnapshot>(
  {
    addressId: { type: Schema.Types.ObjectId, ref: "Address", default: undefined },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: undefined },
  },
  { _id: false },
);

const orderPricingSnapshotSchema = new Schema<OrderPricingSnapshot>(
  {
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    deliveryCharge: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    homeDeliveryAvailable: { type: Boolean, required: true, default: true },
    pickupAvailable: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const orderSchema = new Schema<Order>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSnapshotSchema],
      required: true,
    },
    addressSnapshot: {
      type: orderAddressSnapshotSchema,
      default: undefined,
    },
    pricingSnapshot: {
      type: orderPricingSnapshotSchema,
      required: true,
    },
    deliveryMethod: {
      type: String,
      required: true,
      enum: DELIVERY_METHODS,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: PAYMENT_STATUSES,
      default: "PENDING",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    estimatedReadyTime: {
      type: Date,
      default: undefined,
    },
    scheduledDate: {
      type: Date,
      default: undefined,
    },
    scheduledTimeSlot: {
      type: String,
      trim: true,
      maxlength: 100,
      default: undefined,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    cancelledAt: {
      type: Date,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

// Named indexes
orderSchema.index(
  { orderNumber: 1 },
  { unique: true, name: INDEX_NAMES.ORDER_NUMBER_UNIQUE },
);

orderSchema.index(
  { customerId: 1 },
  { name: INDEX_NAMES.ORDER_CUSTOMER },
);

orderSchema.index(
  { orderStatus: 1 },
  { name: INDEX_NAMES.ORDER_STATUS },
);

orderSchema.index(
  { createdAt: -1 },
  { name: INDEX_NAMES.ORDER_CREATED_AT },
);

export const OrderModel = model<Order>(
  "Order",
  orderSchema,
  COLLECTION_NAMES.ORDERS,
);
