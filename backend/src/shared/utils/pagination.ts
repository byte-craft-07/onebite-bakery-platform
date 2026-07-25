import { PAGINATION_DEFAULTS } from "../constants/pagination.js";
import type {
  PaginationMeta,
  PaginationQuery,
} from "../types/pagination.types.js";

const toPositiveInteger = (value: unknown, fallback: number): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

export const resolvePagination = (
  pageValue: unknown,
  limitValue: unknown,
): PaginationQuery => {
  const page = toPositiveInteger(pageValue, PAGINATION_DEFAULTS.PAGE);
  const requestedLimit = toPositiveInteger(
    limitValue,
    PAGINATION_DEFAULTS.LIMIT,
  );
  const limit = Math.min(requestedLimit, PAGINATION_DEFAULTS.MAX_LIMIT);

  return { page, limit };
};

export const createPaginationMeta = (
  pagination: PaginationQuery,
  total: number,
): PaginationMeta => {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

