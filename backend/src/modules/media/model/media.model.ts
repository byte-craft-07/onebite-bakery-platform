import { model, Schema, type Types } from "mongoose";

import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";
import {
  MEDIA_ENTITY_TYPES,
  STORAGE_PROVIDERS,
  type MediaEntityType,
  type StorageProviderType,
} from "../constants/index.js";

export interface Media extends TimestampedDocument {
  _id: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
  storageProvider: StorageProviderType;
  storagePath: string;
  publicUrl: string;
  uploadedBy: Types.ObjectId;
  entityType: MediaEntityType;
  entityId?: string;
  checksum?: string;
}

const mediaSchema = new Schema<Media>(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    extension: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    width: {
      type: Number,
      min: 0,
      default: undefined,
    },
    height: {
      type: Number,
      min: 0,
      default: undefined,
    },
    storageProvider: {
      type: String,
      required: true,
      enum: STORAGE_PROVIDERS,
      default: "LOCAL",
    },
    storagePath: {
      type: String,
      required: true,
      trim: true,
    },
    publicUrl: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: MEDIA_ENTITY_TYPES,
      index: true,
    },
    entityId: {
      type: String,
      trim: true,
      default: undefined,
      index: true,
    },
    checksum: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

export const MediaModel = model<Media>("Media", mediaSchema, "media");
