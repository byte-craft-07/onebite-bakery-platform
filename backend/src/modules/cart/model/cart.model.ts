import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";
import type { ProductType } from "../../product/constants/index.js";

export interface CustomCakeConfig {
  flavour?: string;
  weightKg?: number;
  tierCount?: number;
  eggPreference?: "EGG" | "EGGLESS";
  messageOnCake?: string;
  specialInstructions?: string;
}

export interface ProductSnapshot {
  name: string;
  slug: string;
  thumbnailUrl?: string;
  productType: ProductType;
}

export interface CartItem {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  unitPriceSnapshot: number;
  unitPrice: number;
  totalPrice: number;
  productType: ProductType;
  customization?: CustomCakeConfig;
  customCakeConfig?: CustomCakeConfig;
  productSnapshot: ProductSnapshot;
  addedAt: Date;
  selectedVariant?: Record<string, unknown>;
  notes?: string;
}

export interface Cart extends TimestampedDocument {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  sessionId?: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  estimatedDiscount: number;
  estimatedTax: number;
  estimatedDeliveryCharge: number;
  grandTotal: number;
  homeDeliveryAvailable: boolean;
  pickupAvailable: boolean;
  appliedOffers: string[];
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

const productSnapshotSchema = new Schema<ProductSnapshot>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true, default: undefined },
    productType: {
      type: String,
      required: true,
      enum: ["NORMAL", "COMBO", "CUSTOM_CAKE", "DECORATION"],
    },
  },
  { _id: false },
);

const cartItemSchema = new Schema<CartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPriceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    productType: {
      type: String,
      required: true,
      enum: ["NORMAL", "COMBO", "CUSTOM_CAKE", "DECORATION"],
    },
    customization: {
      type: customCakeConfigSchema,
      default: undefined,
    },
    customCakeConfig: {
      type: customCakeConfigSchema,
      default: undefined,
    },
    productSnapshot: {
      type: productSnapshotSchema,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    selectedVariant: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: undefined,
    },
  },
  { _id: true },
);

const cartSchema = new Schema<Cart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    sessionId: {
      type: String,
      trim: true,
      default: undefined,
    },
    items: {
      type: [cartItemSchema],
      default: [],
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    estimatedDiscount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    estimatedTax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    estimatedDeliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    homeDeliveryAvailable: {
      type: Boolean,
      required: true,
      default: true,
    },
    pickupAvailable: {
      type: Boolean,
      required: true,
      default: true,
    },
    appliedOffers: {
      type: [String],
      required: true,
      default: [],
    },
  },
  baseSchemaOptions,
);

// Sparse unique indexes for userId, customerId, and sessionId
cartSchema.index(
  { userId: 1 },
  {
    unique: true,
    sparse: true,
  },
);

cartSchema.index(
  { customerId: 1 },
  {
    unique: true,
    sparse: true,
    name: INDEX_NAMES.CART_CUSTOMER_UNIQUE,
  },
);

cartSchema.index(
  { sessionId: 1 },
  {
    unique: true,
    sparse: true,
    name: INDEX_NAMES.CART_SESSION_UNIQUE,
  },
);

export const CartModel = model<Cart>(
  "Cart",
  cartSchema,
  COLLECTION_NAMES.CARTS,
);
