import crypto from "node:crypto";
import { Types } from "mongoose";

export const isValidObjectId = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return Types.ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value);
};

export const toObjectId = (value: string | Types.ObjectId): Types.ObjectId => {
  if (value instanceof Types.ObjectId) {
    return value;
  }

  if (typeof value === "string" && isValidObjectId(value)) {
    return new Types.ObjectId(value);
  }

  const str = String(value || "default");
  const hexHash = crypto.createHash("md5").update(str).digest("hex").slice(0, 24);
  return new Types.ObjectId(hexHash);
};


