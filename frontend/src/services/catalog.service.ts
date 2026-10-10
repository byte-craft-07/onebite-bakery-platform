import { apiClient } from "./api.client";
import { authService } from "./auth.service";
import { clientCache } from "@/utils/clientCache";

export interface ProductItem {
  id: string;
  name: string;
  nameHi?: string;
  slug: string;
  description: string;
  descriptionHi?: string;
  shortDescription?: string;
  shortDescriptionHi?: string;
  productType: "NORMAL" | "COMBO" | "CUSTOM_CAKE" | "DECORATION";
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  isEggless: boolean;
  isAvailable: boolean;
  isComingSoon?: boolean;
  isInstantAvailable?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  categoryId?: { id: string; name: string; nameHi?: string; slug: string };
  occasionIds?: Array<{ id: string; name: string; nameHi?: string; slug: string }>;
  images?: string[];
  mainImage?: string;
  rating?: number;
  reviewCount?: number;
  stockQuantity?: number;
  weightOptions?: Array<{
    weight: string;
    serves?: string;
    price: number;
    compareAtPrice?: number;
  }>;
}

export interface CategoryItem {
  id: string;
  name: string;
  nameHi?: string;
  slug: string;
  description?: string;
  descriptionHi?: string;
  image?: string;
  isComingSoon?: boolean;
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
  isInstantAvailable?: boolean;
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
  searchProducts: async (
    params: SearchProductsQueryParams = {},
    forceRefresh: boolean = false
  ): Promise<PaginatedProductsResponse> => {
    const storedLocation = authService.getStoredLocation();
    const villageId = storedLocation?.villageId;
    const villageName = storedLocation?.villageName;
    const district = storedLocation?.district;

    const cacheKey = `products_${JSON.stringify(params)}_${villageId || ""}_${district || ""}`;

    return clientCache.withCache(
      cacheKey,
      async () => {
        try {
          const response = await apiClient.get<{
            success: boolean;
            data: {
              products?: any[];
              items?: any[];
              pagination?: any;
            };
          }>("/products", {
            params: {
              ...params,
              ...(villageId ? { villageId } : {}),
              ...(villageName ? { villageName } : {}),
              ...(district ? { district } : {}),
              ...(villageName || district ? { location: `${villageName || ""}, ${district || ""}` } : {}),
            },
          });

          const rawProducts = response.data?.data?.products || response.data?.data?.items;
          if (Array.isArray(rawProducts)) {
            const branchTitle = villageName ? `${villageName} (${district || ""})` : district;
            const mappedProducts = rawProducts.map((p: any) => {
              const mainImg =
                p.thumbnailUrl ||
                p.mainImage ||
                (p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : undefined) ||
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";

              const allImgs =
                Array.isArray(p.imageUrls) && p.imageUrls.length > 0
                  ? p.imageUrls
                  : Array.isArray(p.images) && p.images.length > 0
                  ? p.images
                  : [mainImg];

              return {
                ...p,
                id: p.id || p._id,
                locationBranchName: p.branchSnapshot?.name || (branchTitle ? `${branchTitle} Branch` : undefined),
                rating: p.rating ?? 4.9,
                reviewCount: p.reviewCount ?? 62,
                isEggless: p.isEggless ?? true,
                isBestseller: p.isBestseller ?? p.isFeatured ?? true,
                isComingSoon: Boolean(p.isComingSoon),
                compareAtPrice: p.compareAtPrice ?? (p.price ? Math.round(p.price * 1.12) : undefined),
                mainImage: mainImg,
                images: allImgs,
              };
            });
            return {
              products: mappedProducts,
              pagination: response.data?.data?.pagination || {
                total: mappedProducts.length,
                page: 1,
                limit: 12,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
              },
            };
          }
        } catch (_err) {
          // Network or API error
        }

        return {
          products: [],
          pagination: {
            total: 0,
            page: params.page || 1,
            limit: params.limit || 12,
            totalPages: 1,
          },
        };
      },
      3 * 60 * 1000,
      forceRefresh
    );
  },

  getProductById: async (id: string): Promise<ProductItem | null> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { product: ProductItem };
      }>(`/products/id/${id}`);
      return response.data?.data?.product || null;
    } catch (_err) {
      return null;
    }
  },

  getProductBySlug: async (slug: string, forceRefresh: boolean = false): Promise<ProductItem> => {
    const storedLocation = authService.getStoredLocation();
    const villageId = storedLocation?.villageId || "";
    const cacheKey = `product_slug_${slug}_${villageId}`;

    return clientCache.withCache(
      cacheKey,
      async () => {
        try {
          const response = await apiClient.get<{
            success: boolean;
            data: { product: ProductItem };
          }>(`/products/${slug}`, {
            params: {
              ...(villageId ? { villageId } : {}),
            },
          });
          if (response.data?.data?.product) {
            return response.data.data.product;
          }
          throw new Error(`Product with slug "${slug}" not found.`);
        } catch (_err) {
          throw new Error(`Product with slug "${slug}" not found.`);
        }
      },
      5 * 60 * 1000,
      forceRefresh
    );
  },

  getCategories: async (forceRefresh: boolean = false): Promise<CategoryItem[]> => {
    return clientCache.withCache(
      "catalog_categories",
      async () => {
        try {
          const response = await apiClient.get<{
            success: boolean;
            data: { categories: CategoryItem[] };
          }>("/categories");
          const list = response.data?.data?.categories || [];
          const seenCatKeys = new Set<string>();
          return list.filter((cat) => {
            const key = (cat.slug || cat.name || cat.id || "").toLowerCase().trim();
            if (!key || seenCatKeys.has(key)) {
              return false;
            }
            seenCatKeys.add(key);
            return true;
          });
        } catch (_err) {
          return [];
        }
      },
      10 * 60 * 1000, // 10 minutes cache
      forceRefresh
    );
  },

  getOccasions: async (forceRefresh: boolean = false): Promise<OccasionItem[]> => {
    return clientCache.withCache(
      "catalog_occasions",
      async () => {
        try {
          const response = await apiClient.get<{
            success: boolean;
            data: { occasions: OccasionItem[] };
          }>("/occasions");
          const list = response.data?.data?.occasions || [];
          const seenOccKeys = new Set<string>();
          return list.filter((occ) => {
            const key = (occ.slug || occ.name || occ.id || "").toLowerCase().trim();
            if (!key || seenOccKeys.has(key)) {
              return false;
            }
            seenOccKeys.add(key);
            return true;
          });
        } catch (_err) {
          return [];
        }
      },
      10 * 60 * 1000, // 10 minutes cache
      forceRefresh
    );
  },
};
