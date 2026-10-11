import { apiClient } from "./api.client";

export interface DecorationWeightOption {
  weight: string;
  serves?: string;
  price: number;
  compareAtPrice?: number;
}

export interface Decoration {
  id: string;
  _id?: string;
  name: string;
  nameHi?: string;
  slug: string;
  sku?: string;
  category: string;
  price: number;
  originalPrice: number;
  unit?: string;
  rating: number;
  image: string;
  images?: string[];
  description: string;
  descriptionHi?: string;
  stockQuantity?: number;
  inStock: boolean;
  isActive: boolean;
  isComingSoon?: boolean;
  isInstantAvailable?: boolean;
  isEggless?: boolean;
  weightOptions?: DecorationWeightOption[];
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDecorationPayload {
  name: string;
  nameHi?: string;
  slug?: string;
  sku?: string;
  category: string;
  price: number;
  originalPrice: number;
  unit?: string;
  rating?: number;
  image: string;
  images?: string[];
  description: string;
  descriptionHi?: string;
  stockQuantity?: number;
  inStock?: boolean;
  isActive?: boolean;
  isComingSoon?: boolean;
  isInstantAvailable?: boolean;
  isEggless?: boolean;
  weightOptions?: DecorationWeightOption[];
  displayOrder?: number;
}

function normalizeDecoration(d: any): Decoration {
  const rawList = Array.isArray(d?.images) ? d.images.filter(Boolean) : [];
  const mainImg =
    (typeof d?.image === "string" && d.image.trim()) ||
    rawList[0] ||
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80";
  const dedupedImages = Array.from(new Set([mainImg, ...rawList].filter(Boolean)));

  return {
    ...d,
    id: d._id || d.id,
    image: mainImg,
    images: dedupedImages,
    stockQuantity: typeof d.stockQuantity === "number" ? d.stockQuantity : (d.inStock !== false ? 50 : 0),
    isInstantAvailable: d.isInstantAvailable !== false,
    isEggless: d.isEggless !== false,
    isComingSoon: Boolean(d.isComingSoon),
  };
}

export class DecorationService {
  async getDecorations(category?: string): Promise<Decoration[]> {
    const params = category && category !== "ALL" ? { category } : undefined;
    const res = await apiClient.get<{ success: boolean; data: any[] }>("/decorations", { params });
    return (res.data.data || []).map(normalizeDecoration);
  }

  async getDecorationCategories(): Promise<string[]> {
    try {
      const res = await apiClient.get<{ success: boolean; data: string[] }>("/decorations/categories");
      return (res.data?.data || []).filter(Boolean);
    } catch {
      return [];
    }
  }

  async getDecorationById(id: string): Promise<Decoration> {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/decorations/${id}`);
    return normalizeDecoration(res.data.data);
  }

  async adminGetDecorations(params?: { search?: string; category?: string; status?: string }): Promise<Decoration[]> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>("/decorations/admin/all", { params });
    return (res.data.data || []).map(normalizeDecoration);
  }

  async adminCreateDecoration(payload: CreateDecorationPayload): Promise<Decoration> {
    const res = await apiClient.post<{ success: boolean; data: any }>("/decorations", payload);
    return normalizeDecoration(res.data.data);
  }

  async adminUpdateDecoration(id: string, payload: Partial<CreateDecorationPayload>): Promise<Decoration> {
    const res = await apiClient.put<{ success: boolean; data: any }>(`/decorations/${id}`, payload);
    return normalizeDecoration(res.data.data);
  }

  async adminUpdateInventory(id: string, stockQuantity: number): Promise<Decoration> {
    const res = await apiClient.patch<{ success: boolean; data: any }>(`/decorations/${id}/inventory`, {
      stockQuantity,
    });
    return normalizeDecoration(res.data.data);
  }

  async adminToggleStatus(id: string): Promise<Decoration> {
    const res = await apiClient.patch<{ success: boolean; data: any }>(`/decorations/${id}/toggle`);
    return normalizeDecoration(res.data.data);
  }

  async adminToggleStock(id: string): Promise<Decoration> {
    const res = await apiClient.patch<{ success: boolean; data: any }>(`/decorations/${id}/stock`);
    return normalizeDecoration(res.data.data);
  }

  async adminToggleComingSoon(id: string): Promise<Decoration> {
    const res = await apiClient.patch<{ success: boolean; data: any }>(`/decorations/${id}/coming-soon`);
    return normalizeDecoration(res.data.data);
  }

  async adminDeleteDecoration(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean }>(`/decorations/${id}`);
    return res.data.success;
  }
}

export const decorationService = new DecorationService();
