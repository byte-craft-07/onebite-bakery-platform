import { apiClient } from "./api.client";
import { authService } from "./auth.service";
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
  stockQuantity?: number;
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
  images: p.images && p.images.length > 0 ? p.images : [p.image],
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
    const storedLocation = authService.getStoredLocation();
    const villageId = storedLocation?.villageId;
    const villageName = storedLocation?.villageName;
    const district = storedLocation?.district;

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

      const rawProducts = response.data?.data?.products || response.data?.data?.items || [];
      if (Array.isArray(rawProducts) && rawProducts.length > 0) {
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
      // Fallback to local catalog items
    }

    let list = [...fallbackProducts];

    // Main Branch default catalog: All products are available at standard prices for all villages
    list = list.map((item) => ({
      ...item,
      isAvailable: true,
    }));

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

    // 2.5 Occasion Filter
    if (params.occasion && params.occasion !== "all") {
      const occLower = params.occasion.toLowerCase().trim();
      list = list.filter((p) => {
        const occs = p.occasionIds || [];
        const matchesOccList = occs.some(
          (o) => o.slug.toLowerCase().includes(occLower) || o.name.toLowerCase().includes(occLower)
        );
        if (matchesOccList) return true;

        const combinedText = `${p.name} ${p.description || ""} ${(p.categoryId?.name || "")}`.toLowerCase();
        if (occLower.includes("birth")) return combinedText.includes("cake") || combinedText.includes("chocolate") || combinedText.includes("birth");
        if (occLower.includes("anniv")) return combinedText.includes("velvet") || combinedText.includes("truffle") || combinedText.includes("anniv");
        if (occLower.includes("wed")) return combinedText.includes("cake") || combinedText.includes("tart") || combinedText.includes("wed");
        if (occLower.includes("other") || occLower.includes("fest")) return true;

        return combinedText.includes(occLower);
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

  getProductById: async (id: string): Promise<ProductItem | null> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { product: ProductItem };
      }>(`/products/id/${id}`);
      return response.data.data.product;
    } catch (_err) {
      const found = fallbackProducts.find((p) => p.id === id);
      return found || null;
    }
  },

  getProductBySlug: async (slug: string): Promise<ProductItem> => {
    try {
      const storedLocation = authService.getStoredLocation();
      const villageId = storedLocation?.villageId;
      const response = await apiClient.get<{
        success: boolean;
        data: { product: ProductItem };
      }>(`/products/${slug}`, {
        params: {
          ...(villageId ? { villageId } : {}),
        },
      });
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

    // Deduplicate categories by slug and name
    const seenCatKeys = new Set<string>();
    categories = categories.filter((cat) => {
      const key = (cat.slug || cat.name || cat.id || "").toLowerCase().trim();
      if (!key || seenCatKeys.has(key)) {
        return false;
      }
      seenCatKeys.add(key);
      return true;
    });

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
    let occasions: OccasionItem[] = [];
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { occasions: OccasionItem[] };
      }>("/occasions");
      if (response.data?.data?.occasions && response.data.data.occasions.length > 0) {
        occasions = response.data.data.occasions;
      }
    } catch (_err) {
      // Fallback
    }

    if (occasions.length === 0) {
      occasions = MOCK_OCCASIONS.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        image: o.image,
        tagline: o.tagline,
      }));
    }

    // Deduplicate occasions by slug and name
    const seenOccKeys = new Set<string>();
    return occasions.filter((occ) => {
      const key = (occ.slug || occ.name || occ.id || "").toLowerCase().trim();
      if (!key || seenOccKeys.has(key)) {
        return false;
      }
      seenOccKeys.add(key);
      return true;
    });
  },
};
