import type { ProductType } from "../../product/constants/index.js";
import type { ProductResponse } from "../../product/types/index.js";

export type SearchSortOption =
  | "newest"
  | "relevance"
  | "price_asc"
  | "price-asc"
  | "price_desc"
  | "price-desc"
  | "featured"
  | "trending"
  | "recommended";

export interface SearchQueryDto {
  q?: string;
  query?: string;
  page?: number;
  limit?: number;
  sort?: SearchSortOption;
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

export interface MatchedCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface MatchedOccasionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface SearchResultResponse {
  query: string;
  products: ProductResponse[];
  matchedCategories: MatchedCategoryItem[];
  matchedOccasions: MatchedOccasionItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SearchProvider {
  readonly providerName: string;
  search(query: SearchQueryDto): Promise<SearchResultResponse>;
}
