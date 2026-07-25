import type { Types } from "mongoose";

export interface TimestampedDocument {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletableDocument {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

export interface GeoJsonPoint {
  type: "Point";
  coordinates: [number, number];
}

