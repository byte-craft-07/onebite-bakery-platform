import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface Favorite extends TimestampedDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productId: string;
}

const favoriteSchema = new Schema<Favorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  baseSchemaOptions,
);

favoriteSchema.index(
  { userId: 1, productId: 1 },
  { unique: true, name: "favorites_user_product_unique" },
);

export const FavoriteModel = model<Favorite>(
  "Favorite",
  favoriteSchema,
  COLLECTION_NAMES.FAVORITES,
);
