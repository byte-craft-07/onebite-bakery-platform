import { apiClient } from "@/services/api.client";
import { catalogService } from "@/services/catalog.service";

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
  getProducts: async () => {
    return catalogService.searchProducts({});
  },

  createProduct: async (payload: CreateProductPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { product: any };
    }>("/products", payload);
    return response.data.data.product;
  },

  updateProduct: async (id: string, payload: Partial<CreateProductPayload>) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { product: any };
    }>(`/products/${id}`, payload);
    return response.data.data.product;
  },

  deleteProduct: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/products/${id}`);
    return response.data;
  },

  getCategories: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { categories: any[] };
      }>("/categories");
      return response.data.data.categories;
    } catch (_err) {
      return [
        { id: "cat-1", name: "Artisanal Cakes", slug: "artisanal-cakes", description: "Freshly baked celebration cakes", itemCount: 24, isActive: true },
        { id: "cat-2", name: "Pastries & Tarts", slug: "pastries-tarts", description: "French pastries and fruit tarts", itemCount: 18, isActive: true },
        { id: "cat-3", name: "Fresh Breads", slug: "fresh-breads", description: "Sourdough breads and brioche", itemCount: 12, isActive: true },
      ];
    }
  },

  createCategory: async (payload: { name: string; slug: string; description?: string; image?: string }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { category: any };
    }>("/categories", payload);
    return response.data.data.category;
  },

  getOccasions: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { occasions: any[] };
      }>("/occasions");
      return response.data.data.occasions;
    } catch (_err) {
      return [
        { id: "occ-1", name: "Birthdays", slug: "birthdays", tagline: "Celebrate special milestones with custom tiered cakes.", isActive: true },
        { id: "occ-2", name: "Anniversaries", slug: "anniversaries", tagline: "Romantic red velvet and Belgian chocolate treats.", isActive: true },
        { id: "occ-3", name: "Weddings", slug: "weddings", tagline: "Elegant multi-tier custom centerpiece creations.", isActive: true },
      ];
    }
  },

  createOccasion: async (payload: { name: string; slug: string; tagline?: string; image?: string }) => {
    void payload;
    throw new Error("Occasion owner API is not available yet.");
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
