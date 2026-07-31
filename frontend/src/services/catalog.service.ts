import { apiClient } from "./api.client";

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  productType: "NORMAL" | "COMBO" | "CUSTOM_CAKE" | "DECORATION";
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  isEggless: boolean;
  isAvailable: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  categoryId?: { id: string; name: string; slug: string };
  occasionIds?: Array<{ id: string; name: string; slug: string }>;
  images?: string[];
  mainImage?: string;
  rating?: number;
  reviewCount?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  itemCount?: number;
}

export interface OccasionItem {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  image?: string;
}

export interface SearchProductsQueryParams {
  q?: string;
  category?: string;
  occasion?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProductsResponse {
  products: ProductItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const catalogService = {
  searchProducts: async (params: SearchProductsQueryParams = {}): Promise<PaginatedProductsResponse> => {
    const response = await apiClient.get<{
      success: boolean;
      data: PaginatedProductsResponse;
    }>("/search/products", { params });
    return response.data.data;
  },

  getProductBySlug: async (slug: string): Promise<ProductItem> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { product: ProductItem };
    }>(`/products/slug/${slug}`);
    return response.data.data.product;
  },

  getCategories: async (): Promise<CategoryItem[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { categories: CategoryItem[] };
    }>("/categories");
    return response.data.data.categories;
  },

  getOccasions: async (): Promise<OccasionItem[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { occasions: OccasionItem[] };
    }>("/occasions");
    return response.data.data.occasions;
  },
};
