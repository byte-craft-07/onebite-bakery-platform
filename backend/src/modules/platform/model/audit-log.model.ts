import { model, Schema, type Types } from "mongoose";

import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export interface AuditLog extends TimestampedDocument {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const auditLogSchema = new Schema<AuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      trim: true,
      default: undefined,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      trim: true,
      default: undefined,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  baseSchemaOptions,
);

export const AuditLogModel = model<AuditLog>(
  "AuditLog",
  auditLogSchema,
  "audit_logs",
);
