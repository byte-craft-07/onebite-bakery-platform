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
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "../constants/index.js";

export interface OrderItemSnapshot {
  productId: Types.ObjectId;
  productNameSnapshot: string;
  productName: string;
  slug: string;
  categoryName?: string;
  occasionName?: string;
  productType: ProductType;
  image?: string;
  unitPriceSnapshot: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  customization?: CustomCakeConfig;
  customCakeConfig?: CustomCakeConfig;
  comboItemsSnapshot?: string[];
  selectedVariant?: Record<string, unknown>;
  notes?: string;
}

export interface OrderAddressSnapshot {
  addressId?: Types.ObjectId;
  fullName: string;
  phone: string;
  village?: string;
  district?: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderLocationSnapshot {
  villageId?: Types.ObjectId;
  villageName: string;
  district: string;
  pincode: string;
}

export interface OrderBranchSnapshot {
  branchId: Types.ObjectId;
  name: string;
  code: string;
  type: "MAIN" | "FRANCHISE";
}

export interface OrderDeliveryAgentSnapshot {
  agentId: Types.ObjectId;
  name: string;
  phone?: string;
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
  userId?: Types.ObjectId;
  customerId: Types.ObjectId;
  branchId?: Types.ObjectId;
  deliveryAgentId?: Types.ObjectId;
  addressId?: Types.ObjectId;
  items: OrderItemSnapshot[];
  addressSnapshot?: OrderAddressSnapshot;
  locationSnapshot?: OrderLocationSnapshot;
  branchSnapshot?: OrderBranchSnapshot;
  deliveryAgentSnapshot?: OrderDeliveryAgentSnapshot;
  pricingSnapshot: OrderPricingSnapshot;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  deliveryMethod: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  deliveryTimingType?: "INSTANT" | "SCHEDULED";
  deliveryTimePreference?: string;
  estimatedReadyTime?: Date;
  scheduledDate?: Date;
  scheduledTimeSlot?: string;
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  deliveryStartedAt?: Date;
  deliveredAt?: Date;
  deliveryCompletedBy?: Types.ObjectId;
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
    productNameSnapshot: { type: String, required: true, trim: true },
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
    unitPriceSnapshot: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    customization: { type: customCakeConfigSchema, default: undefined },
    customCakeConfig: { type: customCakeConfigSchema, default: undefined },
    comboItemsSnapshot: { type: [String], default: undefined },
    selectedVariant: { type: Schema.Types.Mixed, default: undefined },
    notes: { type: String, trim: true, maxlength: 300, default: undefined },
  },
  { _id: false },
);

const orderAddressSnapshotSchema = new Schema<OrderAddressSnapshot>(
  {
    addressId: { type: Schema.Types.ObjectId, ref: "Address", default: undefined },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    village: { type: String, trim: true, default: undefined },
    district: { type: String, trim: true, default: undefined },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: undefined },
  },
  { _id: false },
);

const orderLocationSnapshotSchema = new Schema<OrderLocationSnapshot>(
  {
    villageId: { type: Schema.Types.ObjectId, ref: "Village", default: undefined },
    villageName: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderBranchSnapshotSchema = new Schema<OrderBranchSnapshot>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    type: { type: String, enum: ["MAIN", "FRANCHISE"], required: true },
  },
  { _id: false },
);

const orderDeliveryAgentSnapshotSchema = new Schema<OrderDeliveryAgentSnapshot>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: undefined },
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
      trim: true,
      maxlength: 50,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: undefined,
    },
    deliveryAgentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      default: undefined,
    },
    items: {
      type: [orderItemSnapshotSchema],
      required: true,
    },
    addressSnapshot: {
      type: orderAddressSnapshotSchema,
      default: undefined,
    },
    locationSnapshot: {
      type: orderLocationSnapshotSchema,
      default: undefined,
    },
    branchSnapshot: {
      type: orderBranchSnapshotSchema,
      default: undefined,
    },
    deliveryAgentSnapshot: {
      type: orderDeliveryAgentSnapshotSchema,
      default: undefined,
    },
    pricingSnapshot: {
      type: orderPricingSnapshotSchema,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryMethod: {
      type: String,
      required: true,
      enum: DELIVERY_METHODS,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "UPI",
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
    deliveryTimingType: {
      type: String,
      enum: ["INSTANT", "SCHEDULED"],
      default: "INSTANT",
    },
    deliveryTimePreference: {
      type: String,
      trim: true,
      maxlength: 200,
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
    deliveryStartedAt: {
      type: Date,
      default: undefined,
    },
    deliveredAt: {
      type: Date,
      default: undefined,
    },
    deliveryCompletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
  },
  baseSchemaOptions,
);

// Named indexes
orderSchema.index(
  { deliveryAgentId: 1, orderStatus: 1 },
  { sparse: true },
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

orderSchema.index(
  { branchId: 1 },
  { sparse: true },
);

export const OrderModel = model<Order>(
  "Order",
  orderSchema,
  COLLECTION_NAMES.ORDERS,
);
