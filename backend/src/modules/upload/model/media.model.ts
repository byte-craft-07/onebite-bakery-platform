import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { softDeleteSchemaFields } from "../../../db/schema-fields.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type {
  SoftDeletableDocument,
  TimestampedDocument,
} from "../../../db/types/base-document.types.js";

export interface Media extends TimestampedDocument, SoftDeletableDocument {
  _id: Types.ObjectId;
  originalName: string;
  fileName: string;
  mimeType: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  storageProvider: string;
  uploadedBy?: Types.ObjectId;
  tags: string[];
  altText?: string;
}

const mediaSchema = new Schema<Media>(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    extension: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 20,
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
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    storageProvider: {
      type: String,
      required: true,
      trim: true,
      default: "LOCAL",
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    tags: {
      type: [String],
      required: true,
      default: [],
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 300,
      default: undefined,
    },
    ...softDeleteSchemaFields,
  },
  baseSchemaOptions,
);

// Named indexes
mediaSchema.index(
  { fileName: 1 },
  { unique: true, name: INDEX_NAMES.MEDIA_FILE_NAME_UNIQUE },
);

mediaSchema.index(
  { uploadedBy: 1 },
  { name: INDEX_NAMES.MEDIA_UPLOADED_BY },
);

mediaSchema.index(
  { mimeType: 1 },
  { name: INDEX_NAMES.MEDIA_MIME_TYPE },
);

export const MediaModel = model<Media>(
  "Media",
  mediaSchema,
  COLLECTION_NAMES.MEDIA,
);
