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
  thumbnailUrl?: string;
  images?: string[];
  imageUrls?: string[];
  stockQuantity?: number;
}

export const adminCatalogService = {
  getProducts: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { products: any[] };
      }>("/products/admin");
      if (response.data?.data?.products) {
        return response.data.data.products.map((p) => ({
          id: p.id || p._id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          productType: p.productType || "NORMAL",
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          sku: p.sku || `SKU-${p.id}`,
          isEggless: p.isEggless ?? true,
          isAvailable: p.isAvailable ?? true,
          stockQuantity: p.stockQuantity ?? 50,
          mainImage:
            p.thumbnailUrl ||
            p.mainImage ||
            (p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : undefined) ||
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80",
        }));
      }
    } catch (_err) {
      // Fallback to public catalog search
    }
    const res = await catalogService.searchProducts({ limit: 50 });
    return res.products.map((p) => ({
      ...p,
      stockQuantity: (p as any).stockQuantity ?? 50,
    }));
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

  updateInventory: async (id: string, stockQuantity: number) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { inventory: any };
    }>(`/products/${id}/inventory`, { stockQuantity });
    return response.data.data.inventory;
  },

  updateAvailability: async (id: string, isAvailable: boolean) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { inventory: any };
    }>(`/products/${id}/availability`, { isAvailable });
    return response.data.data.inventory;
  },

  updatePricing: async (id: string, price: number) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { inventory: any };
    }>(`/products/${id}/pricing`, { price });
    return response.data.data.inventory;
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
      }>("/categories/admin");
      if (response.data?.data?.categories) {
        return response.data.data.categories;
      }
    } catch (_err) {
      // Fallback
    }
    return catalogService.getCategories();
  },

  createCategory: async (payload: { name: string; slug: string; description?: string; image?: string }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { category: any };
    }>("/categories", payload);
    return response.data.data.category;
  },

  updateCategory: async (id: string, payload: Partial<{ name: string; slug: string; description: string; isActive: boolean }>) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { category: any };
    }>(`/categories/${id}`, payload);
    return response.data.data.category;
  },

  deleteCategory: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/categories/${id}`);
    return response.data;
  },

  getOccasions: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { occasions: any[] };
      }>("/occasions/admin");
      if (response.data?.data?.occasions) {
        return response.data.data.occasions;
      }
    } catch (_err) {
      // Fallback
    }
    return catalogService.getOccasions();
  },

  createOccasion: async (payload: { name: string; slug?: string; description?: string; bannerImage?: string; tagline?: string }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { occasion: any };
    }>("/occasions", {
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: payload.description || payload.tagline || `${payload.name} celebration cakes and desserts`,
      bannerImage: payload.bannerImage || "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80",
      seoTitle: payload.name,
      seoDescription: payload.description || `${payload.name} cakes`,
    });
    return response.data.data.occasion;
  },

  updateOccasion: async (id: string, payload: Partial<{ name: string; slug: string; tagline: string; description: string; bannerImage: string; isActive: boolean }>) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { occasion: any };
    }>(`/occasions/${id}`, payload);
    return response.data.data.occasion;
  },

  deleteOccasion: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/occasions/${id}`);
    return response.data;
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
