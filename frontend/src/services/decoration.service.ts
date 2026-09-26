import { apiClient } from "./api.client";

export interface Decoration {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  images?: string[];
  description: string;
  inStock: boolean;
  isActive: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDecorationPayload {
  name: string;
  slug?: string;
  category: string;
  price: number;
  originalPrice: number;
  rating?: number;
  image: string;
  images?: string[];
  description: string;
  inStock?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

export class DecorationService {
  async getDecorations(category?: string): Promise<Decoration[]> {
    const params = category && category !== "ALL" ? { category } : undefined;
    const res = await apiClient.get<{ success: boolean; data: any[] }>("/decorations", { params });
    return (res.data.data || []).map((d) => ({
      ...d,
      id: d._id || d.id,
    }));
  }

  async getDecorationById(id: string): Promise<Decoration> {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/decorations/${id}`);
    const d = res.data.data;
    return {
      ...d,
      id: d._id || d.id,
    };
  }

  async adminGetDecorations(params?: { search?: string; category?: string; status?: string }): Promise<Decoration[]> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>("/decorations/admin/all", { params });
    return (res.data.data || []).map((d) => ({
      ...d,
      id: d._id || d.id,
    }));
  }

  async adminCreateDecoration(payload: CreateDecorationPayload): Promise<Decoration> {
    const res = await apiClient.post<{ success: boolean; data: any }>("/decorations", payload);
    const d = res.data.data;
    return {
      ...d,
      id: d._id || d.id,
    };
  }

  async adminUpdateDecoration(id: string, payload: Partial<CreateDecorationPayload>): Promise<Decoration> {
    const res = await apiClient.put<{ success: boolean; data: any }>(`/decorations/${id}`, payload);
    const d = res.data.data;
    return {
      ...d,
      id: d._id || d.id,
    };
  }

  async adminToggleStatus(id: string): Promise<Decoration> {
    const res = await apiClient.patch<{ success: boolean; data: any }>(`/decorations/${id}/toggle`);
    const d = res.data.data;
    return {
      ...d,
      id: d._id || d.id,
    };
  }

  async adminToggleStock(id: string): Promise<Decoration> {
    const res = await apiClient.patch<{ success: boolean; data: any }>(`/decorations/${id}/stock`);
    const d = res.data.data;
    return {
      ...d,
      id: d._id || d.id,
    };
  }

  async adminDeleteDecoration(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean }>(`/decorations/${id}`);
    return res.data.success;
  }
}

export const decorationService = new DecorationService();
