import { apiClient } from "@/services/api.client";

export interface CreateProductPayload {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  productType: "NORMAL" | "COMBO" | "CUSTOM_CAKE" | "DECORATION";
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  isEggless?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  categoryId?: string;
  occasionIds?: string[];
  mainImage?: string;
  images?: string[];
  stockQuantity?: number;
}

export const adminCatalogService = {
  createProduct: async (payload: CreateProductPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { product: any };
    }>("/products", payload);
    return response.data.data.product;
  },

  updateProduct: async (id: string, payload: Partial<CreateProductPayload>) => {
    const response = await apiClient.put<{
      success: boolean;
      data: { product: any };
    }>(`/products/${id}`, payload);
    return response.data.data.product;
  },

  deleteProduct: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/products/${id}`);
    return response.data;
  },

  createCategory: async (payload: { name: string; slug: string; description?: string; image?: string }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { category: any };
    }>("/categories", payload);
    return response.data.data.category;
  },

  createOccasion: async (payload: { name: string; slug: string; tagline?: string; image?: string }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { occasion: any };
    }>("/occasions", payload);
    return response.data.data.occasion;
  },

  uploadMedia: async (file: File, entityType = "PRODUCT"): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);

    const response = await apiClient.post<{
      success: boolean;
      data: { media: { url: string } };
    }>("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data.media.url;
  },
};
