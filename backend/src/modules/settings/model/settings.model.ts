import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

interface StoreTimingDay {
  open: string;
  close: string;
  isClosed: boolean;
}

interface StoreTiming {
  monday: StoreTimingDay;
  tuesday: StoreTimingDay;
  wednesday: StoreTimingDay;
  thursday: StoreTimingDay;
  friday: StoreTimingDay;
  saturday: StoreTimingDay;
  sunday: StoreTimingDay;
}

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

interface DeliverySettings {
  minimumHomeDeliveryAmount: number;
  homeDeliveryEnabled: boolean;
  pickupEnabled: boolean;
}

export interface Settings extends TimestampedDocument {
  _id: Types.ObjectId;
  singletonKey: "default";
  bakeryName: string;
  logo?: string;
  phone: string;
  whatsapp?: string;
  address: string;
  storeTiming: StoreTiming;
  deliveryRadius: number;
  deliveryCharge: number;
  delivery: DeliverySettings;
  upiQr?: string;
  upiId?: string;
  socialLinks: SocialLinks;
  isDeliveryEnabled: boolean;
  isPickupEnabled: boolean;
  isCodEnabled: boolean;
  isUpiEnabled: boolean;
}

const storeTimingDaySchema = new Schema<StoreTimingDay>(
  {
    open: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Opening time must be HH:mm."],
    },
    close: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Closing time must be HH:mm."],
    },
    isClosed: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { _id: false },
);

const socialLinksSchema = new Schema<SocialLinks>(
  {
    instagram: { type: String, trim: true, default: undefined },
    facebook: { type: String, trim: true, default: undefined },
    whatsapp: { type: String, trim: true, default: undefined },
  },
  { _id: false },
);

const deliverySettingsSchema = new Schema<DeliverySettings>(
  {
    minimumHomeDeliveryAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 300,
    },
    homeDeliveryEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    pickupEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { _id: false },
);

const settingsSchema = new Schema<Settings>(
  {
    singletonKey: {
      type: String,
      default: "default",
      enum: ["default"],
      required: true,
    },
    bakeryName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },
    logo: {
      type: String,
      trim: true,
      default: undefined,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits."],
    },
    whatsapp: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,15}$/, "WhatsApp number must be 10 to 15 digits."],
      default: undefined,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
    storeTiming: {
      monday: { type: storeTimingDaySchema, required: true },
      tuesday: { type: storeTimingDaySchema, required: true },
      wednesday: { type: storeTimingDaySchema, required: true },
      thursday: { type: storeTimingDaySchema, required: true },
      friday: { type: storeTimingDaySchema, required: true },
      saturday: { type: storeTimingDaySchema, required: true },
      sunday: { type: storeTimingDaySchema, required: true },
    },
    deliveryRadius: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    delivery: {
      type: deliverySettingsSchema,
      default: {},
      required: true,
    },
    upiQr: {
      type: String,
      trim: true,
      default: undefined,
    },
    upiId: {
      type: String,
      trim: true,
      default: undefined,
    },
    socialLinks: {
      type: socialLinksSchema,
      default: {},
    },
    isDeliveryEnabled: {
      type: Boolean,
      default: true,
      required: true,
    },
    isPickupEnabled: {
      type: Boolean,
      default: true,
      required: true,
    },
    isCodEnabled: {
      type: Boolean,
      default: true,
      required: true,
    },
    isUpiEnabled: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  baseSchemaOptions,
);

// Enforces the settings collection as a single document.
settingsSchema.index(
  { singletonKey: 1 },
  { unique: true, name: INDEX_NAMES.SETTINGS_SINGLETON },
);

export const SettingsModel = model<Settings>(
  "Settings",
  settingsSchema,
  COLLECTION_NAMES.SETTINGS,
);
