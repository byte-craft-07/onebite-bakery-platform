import { apiClient } from "./api.client";
import { catalogService, type ProductItem } from "./catalog.service";
import { MOCK_PRODUCTS } from "@/data/mockData";

const FAVORITES_STORAGE_KEY = "theonlinebakery_favorite_ids";
const FAVORITES_PRODUCTS_KEY = "theonlinebakery_favorite_products_cache";

export const favoritesService = {
  getFavoriteIds: (): string[] => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  isFavorite: (productId: string): boolean => {
    const ids = favoritesService.getFavoriteIds();
    return ids.includes(productId);
  },

  getStoredProductsMap: (): Record<string, ProductItem> => {
    try {
      const stored = localStorage.getItem(FAVORITES_PRODUCTS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  getFavorites: async (): Promise<ProductItem[]> => {
    const localMap = favoritesService.getStoredProductsMap();
    const localIds = favoritesService.getFavoriteIds();

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { favorites: (ProductItem | string)[] };
      }>("/favorites");

      const favs = response.data?.data?.favorites || [];
      if (Array.isArray(favs) && favs.length > 0) {
        const productList: ProductItem[] = [];

        for (const item of favs) {
          if (typeof item === "string") {
            const cached = localMap[item];
            if (cached) {
              productList.push(cached);
            } else {
              try {
                const prod = await catalogService.getProductById(item);
                if (prod) productList.push(prod);
              } catch (_err) {
                // Ignore missing
              }
            }
          } else if (item && typeof item === "object" && "id" in item) {
            productList.push(item as ProductItem);
          }
        }

        if (productList.length > 0) {
          const ids = productList.map((p) => p.id);
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
          const newMap = { ...localMap };
          productList.forEach((p) => {
            newMap[p.id] = p;
          });
          localStorage.setItem(FAVORITES_PRODUCTS_KEY, JSON.stringify(newMap));
          return productList;
        }
      }
    } catch (_err) {
      // Use local storage
    }

    // Local fallback
    const fallbackList: ProductItem[] = [];
    for (const id of localIds) {
      if (localMap[id]) {
        fallbackList.push(localMap[id]);
      } else {
        const mockMatch = MOCK_PRODUCTS.find((p) => p.id === id);
        if (mockMatch) {
          fallbackList.push({
            id: mockMatch.id,
            name: mockMatch.name,
            slug: mockMatch.slug,
            description: mockMatch.description,
            productType: "NORMAL",
            price: mockMatch.price,
            compareAtPrice: mockMatch.compareAtPrice,
            sku: mockMatch.id,
            isEggless: mockMatch.isEggless,
            isAvailable: true,
            isBestseller: mockMatch.isBestseller,
            mainImage: mockMatch.image,
            rating: mockMatch.rating,
            reviewCount: mockMatch.reviewCount,
          });
        }
      }
    }

    return fallbackList;
  },

  addFavorite: async (productOrId: string | ProductItem) => {
    const product: ProductItem | null =
      typeof productOrId === "object" ? productOrId : null;
    const productId = typeof productOrId === "string" ? productOrId : productOrId.id;

    const currentIds = favoritesService.getFavoriteIds();
    if (!currentIds.includes(productId)) {
      currentIds.push(productId);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(currentIds));
    }

    if (product) {
      const map = favoritesService.getStoredProductsMap();
      map[productId] = product;
      localStorage.setItem(FAVORITES_PRODUCTS_KEY, JSON.stringify(map));
    }

    window.dispatchEvent(
      new CustomEvent("theonlinebakery_favorites_updated", {
        detail: { productId, isFavorite: true, product },
      })
    );

    try {
      const response = await apiClient.post<{ success: boolean }>("/favorites", {
        productId,
      });
      return response.data;
    } catch {
      return { success: true };
    }
  },

  removeFavorite: async (productId: string) => {
    const currentIds = favoritesService
      .getFavoriteIds()
      .filter((id) => id !== productId);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(currentIds));

    const map = favoritesService.getStoredProductsMap();
    delete map[productId];
    localStorage.setItem(FAVORITES_PRODUCTS_KEY, JSON.stringify(map));

    window.dispatchEvent(
      new CustomEvent("theonlinebakery_favorites_updated", {
        detail: { productId, isFavorite: false },
      })
    );

    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `/favorites/${productId}`
      );
      return response.data;
    } catch {
      return { success: true };
    }
  },

  toggleFavorite: async (productOrId: string | ProductItem): Promise<boolean> => {
    const productId = typeof productOrId === "string" ? productOrId : productOrId.id;
    const isFav = favoritesService.isFavorite(productId);
    if (isFav) {
      await favoritesService.removeFavorite(productId);
      return false;
    } else {
      await favoritesService.addFavorite(productOrId);
      return true;
    }
  },
};
