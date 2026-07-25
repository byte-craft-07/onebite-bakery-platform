import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { INDEX_NAMES } from "../../../db/constants/index-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface RefreshToken extends TimestampedDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenId?: Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
}

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: undefined,
    },
    replacedByTokenId: {
      type: Schema.Types.ObjectId,
      ref: "RefreshToken",
      default: undefined,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: undefined,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

// Token lookup during refresh. Hash is unique so raw tokens are never stored.
refreshTokenSchema.index(
  { tokenHash: 1 },
  { unique: true, name: INDEX_NAMES.REFRESH_TOKEN_HASH_UNIQUE },
);

// Lists active sessions for a user.
refreshTokenSchema.index(
  { userId: 1, expiresAt: 1 },
  { name: INDEX_NAMES.REFRESH_TOKEN_USER },
);

// Automatically removes expired refresh token records.
refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: INDEX_NAMES.REFRESH_TOKEN_EXPIRES_AT_TTL },
);

export const RefreshTokenModel = model<RefreshToken>(
  "RefreshToken",
  refreshTokenSchema,
  COLLECTION_NAMES.REFRESH_TOKENS,
);
