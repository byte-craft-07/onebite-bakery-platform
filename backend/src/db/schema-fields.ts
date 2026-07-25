import { Schema } from "mongoose";

export const softDeleteSchemaFields = {
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: undefined,
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    default: undefined,
  },
} as const;

export const geoJsonPointSchemaFields = {
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator(value: number[]): boolean {
        return value.length === 2;
      },
      message: "Location coordinates must include longitude and latitude.",
    },
  },
} as const;

