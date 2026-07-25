import type { FilterQuery, SortOrder } from "mongoose";

export type SortDirection = "asc" | "desc";

export interface SortInput {
  field: string;
  direction: SortDirection;
}

export const createSearchFilter = <TEntity>(
  fields: Array<keyof TEntity & string>,
  search?: string,
): FilterQuery<TEntity> => {
  if (!search?.trim()) {
    return {};
  }

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: search.trim(), $options: "i" },
    })),
  } as FilterQuery<TEntity>;
};

export const createSort = (sort?: SortInput): Record<string, SortOrder> => {
  if (!sort) {
    return { createdAt: -1 };
  }

  return {
    [sort.field]: sort.direction === "asc" ? 1 : -1,
  };
};

