import { Types } from "mongoose";

export const isValidObjectId = (value: string): boolean => {
  return Types.ObjectId.isValid(value);
};

export const toObjectId = (value: string): Types.ObjectId => {
  return new Types.ObjectId(value);
};

