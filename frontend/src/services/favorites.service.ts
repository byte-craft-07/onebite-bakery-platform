import { apiClient } from "./api.client";
import type { ProductItem } from "./catalog.service";

export const favoritesService = {
  getFavorites: async (): Promise<ProductItem[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { favorites: ProductItem[] };
    }>("/favorites");
    return response.data.data.favorites;
  },

  addFavorite: async (productId: string) => {
    const response = await apiClient.post<{ success: boolean }>("/favorites", { productId });
    return response.data;
  },

  removeFavorite: async (productId: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/favorites/${productId}`);
    return response.data;
  },
};
