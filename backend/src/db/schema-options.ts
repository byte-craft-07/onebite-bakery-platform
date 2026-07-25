import type { SchemaOptions } from "mongoose";

export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
} satisfies SchemaOptions;
