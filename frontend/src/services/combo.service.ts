import { apiClient } from "./api.client";

export interface Combo {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  items: string[];
  price: number;
  originalPrice: number;
  image: string;
  images?: string[];
  badge?: string;
  isActive: boolean;
  isAvailable: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateComboPayload {
  title: string;
  slug?: string;
  description?: string;
  items: string[];
  price: number;
  originalPrice: number;
  image: string;
  images?: string[];
  badge?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  displayOrder?: number;
}

export class ComboService {
  async getCombos(): Promise<Combo[]> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>("/combos");
    return (res.data.data || []).map((c) => ({
      ...c,
      id: c._id || c.id,
    }));
  }

  async getComboById(id: string): Promise<Combo> {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/combos/${id}`);
    const c = res.data.data;
    return {
      ...c,
      id: c._id || c.id,
    };
  }

  async adminGetCombos(): Promise<Combo[]> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>("/combos/admin/all");
    return (res.data.data || []).map((c) => ({
      ...c,
      id: c._id || c.id,
    }));
  }

  async createCombo(payload: CreateComboPayload): Promise<Combo> {
    const res = await apiClient.post<{ success: boolean; data: any }>("/combos", payload);
    const c = res.data.data;
    return {
      ...c,
      id: c._id || c.id,
    };
  }

  async updateCombo(id: string, payload: Partial<CreateComboPayload>): Promise<Combo> {
    const res = await apiClient.put<{ success: boolean; data: any }>(`/combos/${id}`, payload);
    const c = res.data.data;
    return {
      ...c,
      id: c._id || c.id,
    };
  }

  async toggleComboStatus(id: string): Promise<Combo> {
    const res = await apiClient.patch<{ success: boolean; data: any }>(`/combos/${id}/toggle`);
    const c = res.data.data;
    return {
      ...c,
      id: c._id || c.id,
    };
  }

  async deleteCombo(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean }>(`/combos/${id}`);
    return res.data.success;
  }
}

export const comboService = new ComboService();
