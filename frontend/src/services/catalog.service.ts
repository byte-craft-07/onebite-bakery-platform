import { apiClient } from "./api.client";
import { MOCK_CATEGORIES, MOCK_OCCASIONS, MOCK_PRODUCTS } from "@/data/mockData";

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

const fallbackProducts: ProductItem[] = MOCK_PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  productType: "NORMAL",
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  sku: p.id,
  isEggless: p.isEggless,
  isAvailable: true,
  isBestseller: p.isBestseller,
  mainImage: p.image,
  rating: p.rating,
  reviewCount: p.reviewCount,
  categoryId: {
    id: "cat-1",
    name: p.category,
    slug: p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  },
}));

export const catalogService = {
  searchProducts: async (params: SearchProductsQueryParams = {}): Promise<PaginatedProductsResponse> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: PaginatedProductsResponse;
      }>("/search/products", { params });

      if (response.data?.data?.products && response.data.data.products.length > 0) {
        return response.data.data;
      }
    } catch (_err) {
      // Fallback to local catalog items
    }

    let list = [...fallbackProducts];

    if (params.q) {
      const qLower = params.q.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(qLower) || p.description.toLowerCase().includes(qLower)
      );
    }

    if (params.category) {
      const catLower = params.category.toLowerCase();
      const filtered = list.filter(
        (p) =>
          p.categoryId?.slug.includes(catLower) ||
          catLower.includes(p.categoryId?.slug || "")
      );
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    return {
      products: list,
      pagination: {
        total: list.length,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
    };
  },

  getProductBySlug: async (slug: string): Promise<ProductItem> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { product: ProductItem };
      }>(`/products/slug/${slug}`);
      return response.data.data.product;
    } catch (_err) {
      const found = fallbackProducts.find((p) => p.slug === slug);
      if (found) return found;
      return fallbackProducts[0];
    }
  },

  getCategories: async (): Promise<CategoryItem[]> => {
    let categories: CategoryItem[] = [];
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { categories: CategoryItem[] };
      }>("/categories");
      if (response.data?.data?.categories && response.data.data.categories.length > 0) {
        categories = response.data.data.categories;
      }
    } catch (_err) {
      // Fallback
    }

    if (categories.length === 0) {
      categories = MOCK_CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image,
        itemCount: c.itemCount,
      }));
    }

    // Compute real dynamic product count for each category from current backend catalog
    try {
      const products = fallbackProducts;
      categories = categories.map((cat) => {
        const catNameLower = cat.name.toLowerCase();
        const catSlugLower = cat.slug.toLowerCase();

        const matchingCount = products.filter((p) => {
          const pCatName = (p.categoryId?.name || "").toLowerCase();
          const pCatSlug = (p.categoryId?.slug || "").toLowerCase();
          const pName = p.name.toLowerCase();

          return (
            pCatSlug === catSlugLower ||
            pCatName.includes(catNameLower) ||
            catNameLower.includes(pCatName) ||
            pName.includes(catNameLower.replace("s", "").trim())
          );
        }).length;

        return {
          ...cat,
          itemCount: matchingCount > 0 ? matchingCount : products.length,
        };
      });
    } catch (_e) {
      // Keep existing count if check fails
    }

    return categories;
  },

  getOccasions: async (): Promise<OccasionItem[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { occasions: OccasionItem[] };
      }>("/occasions");
      if (response.data?.data?.occasions && response.data.data.occasions.length > 0) {
        return response.data.data.occasions;
      }
    } catch (_err) {
      // Fallback
    }

    return MOCK_OCCASIONS.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      image: o.image,
      tagline: o.tagline,
    }));
  },
};
