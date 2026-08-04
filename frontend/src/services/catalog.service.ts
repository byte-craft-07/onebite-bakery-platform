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
  productType: p.category.toLowerCase().includes("combo") ? "COMBO" : "NORMAL",
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
    id: p.id.startsWith("c") ? `cat-${p.id}` : "cat-1",
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

    // 1. Text Search Query Filter
    if (params.q) {
      const qLower = params.q.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(qLower) ||
          p.description.toLowerCase().includes(qLower) ||
          (p.categoryId?.name || "").toLowerCase().includes(qLower)
      );
    }

    // 2. Category Filter
    if (params.category) {
      const catLower = params.category.toLowerCase().trim();
      list = list.filter((p) => {
        const pSlug = (p.categoryId?.slug || "").toLowerCase();
        const pId = (p.categoryId?.id || "").toLowerCase();
        const pName = (p.categoryId?.name || "").toLowerCase();
        return (
          pSlug === catLower ||
          pId === catLower ||
          pSlug.includes(catLower) ||
          catLower.includes(pSlug) ||
          pName.includes(catLower)
        );
      });
    }

    // 3. Product Type & Dietary Filter
    if (params.productType) {
      const pType = params.productType;
      if (pType === "EGGLESS") {
        list = list.filter((p) => p.isEggless === true);
      } else if (pType === "EGG") {
        list = list.filter((p) => p.isEggless === false);
      } else {
        list = list.filter((p) => p.productType === pType);
      }
    }

    // 4. Price Range Filter (Min & Max)
    if (typeof params.minPrice === "number" && !isNaN(params.minPrice)) {
      list = list.filter((p) => p.price >= params.minPrice!);
    }
    if (typeof params.maxPrice === "number" && !isNaN(params.maxPrice)) {
      list = list.filter((p) => p.price <= params.maxPrice!);
    }

    // 5. Sorting Engine
    if (params.sort) {
      switch (params.sort) {
        case "price_asc":
          list.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          list.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
          break;
        case "newest":
          list.sort((a, b) => b.id.localeCompare(a.id));
          break;
        case "alphabetical":
          list.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "relevance":
        default:
          break;
      }
    }

    // 6. Pagination
    const page = params.page || 1;
    const limit = params.limit || 12;
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedList = list.slice(startIndex, startIndex + limit);

    return {
      products: paginatedList,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  getProductBySlug: async (slug: string): Promise<ProductItem> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { product: ProductItem };
      }>(`/products/${slug}`);
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

    // Compute real dynamic product count for each category
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
