import type { ProductType } from "../constants/index.js";

export type ProductSortOption =
  | "newest"
  | "price_asc"
  | "price-asc"
  | "price_desc"
  | "price-desc"
  | "featured"
  | "trending"
  | "recommended"
  | "display_order"
  | "displayOrder";

export interface PublicProductQueryDto {
  page?: number;
  limit?: number;
  sort?: ProductSortOption;
  category?: string;
  occasion?: string;
  productType?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isSeasonal?: boolean;
  isRecommended?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
