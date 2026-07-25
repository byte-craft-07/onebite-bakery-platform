import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { geoJsonPointSchemaFields } from "../../../db/schema-fields.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type {
  GeoJsonPoint,
  TimestampedDocument,
} from "../../../db/types/base-document.types.js";

export interface Address extends TimestampedDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullName: string;
  phone: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: GeoJsonPoint;
  isDefault: boolean;
}

const addressSchema = new Schema<Address>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Phone number must be 10 to 15 digits."],
    },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: 200,
      default: undefined,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{4,10}$/, "Pincode must be 4 to 10 digits."],
    },
    location: {
      type: geoJsonPointSchemaFields,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  baseSchemaOptions,
);

// Lists saved addresses for a customer.
addressSchema.index({ userId: 1 }, { name: INDEX_NAMES.ADDRESS_USER });

// Supports delivery-radius serviceability checks.
addressSchema.index(
  { location: "2dsphere" },
  { name: INDEX_NAMES.ADDRESS_LOCATION },
);

// Quickly finds a customer's default address.
addressSchema.index(
  { userId: 1, isDefault: 1 },
  { name: INDEX_NAMES.ADDRESS_USER_DEFAULT },
);

export const AddressModel = model<Address>(
  "Address",
  addressSchema,
  COLLECTION_NAMES.ADDRESSES,
);
