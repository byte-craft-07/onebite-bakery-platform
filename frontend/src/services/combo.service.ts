import { apiClient } from "./api.client";
import { clientCache } from "@/utils/clientCache";

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
  async getCombos(forceRefresh: boolean = false): Promise<Combo[]> {
    return clientCache.withCache(
      "combos_list",
      async () => {
        const res = await apiClient.get<{ success: boolean; data: any[] }>("/combos");
        return (res.data.data || []).map((c) => ({
          ...c,
          id: c._id || c.id,
        }));
      },
      5 * 60 * 1000,
      forceRefresh
    );
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
    clientCache.invalidate("combos_list");
    const c = res.data.data;
    return {
      ...c,
      id: c._id || c.id,
    };
  }

  async updateCombo(id: string, payload: Partial<CreateComboPayload>): Promise<Combo> {
    const res = await apiClient.put<{ success: boolean; data: any }>(`/combos/${id}`, payload);
    clientCache.invalidate("combos_list");
    const c = res.data.data;
    return {
      ...c,
      id: c._id || c.id,
    };
  }

  async toggleComboStatus(id: string): Promise<Combo> {
    const res = await apiClient.patch<{ success: boolean; data: any }>(`/combos/${id}/toggle`);
    clientCache.invalidate("combos_list");
    const c = res.data.data;
    return {
      ...c,
      id: c._id || c.id,
    };
  }

  async deleteCombo(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean }>(`/combos/${id}`);
    clientCache.invalidate("combos_list");
    return res.data.success;
  }
}

export const comboService = new ComboService();
