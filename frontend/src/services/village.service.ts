import { apiClient } from "./api.client";

export interface Village {
  id: string;
  name: string;
  district: string;
  pincode: string;
  isActive: boolean;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VillagePayload {
  name: string;
  district: string;
  pincode: string;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  isActive?: boolean;
}

const LOCAL_VILLAGES_KEY = "theonlinebakery_local_villages";

const DEFAULT_VILLAGES: Village[] = [
  { id: "v1", name: "Terha", district: "Hamirpur", pincode: "210502", isActive: true },
  { id: "v2", name: "Hamirpur Town", district: "Hamirpur", pincode: "210502", isActive: true },
  { id: "v3", name: "Kurara", district: "Hamirpur", pincode: "210502", isActive: true },
  { id: "v4", name: "Sumerpur", district: "Hamirpur", pincode: "210502", isActive: true },
  { id: "v5", name: "Maudaha", district: "Hamirpur", pincode: "210507", isActive: true },
];

const getLocalVillages = (): Village[] => {
  try {
    const raw = localStorage.getItem(LOCAL_VILLAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_err) {
    // Ignore
  }
  localStorage.setItem(LOCAL_VILLAGES_KEY, JSON.stringify(DEFAULT_VILLAGES));
  return DEFAULT_VILLAGES;
};

const saveLocalVillages = (list: Village[]) => {
  try {
    localStorage.setItem(LOCAL_VILLAGES_KEY, JSON.stringify(list));
  } catch (_err) {
    // Ignore
  }
};

export const villageService = {
  getDistricts: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { districts: string[] };
      }>("/villages/districts");
      if (response.data?.data?.districts && response.data.data.districts.length > 0) {
        return response.data.data.districts;
      }
    } catch (_err) {
      // Fallback
    }
    const local = getLocalVillages().filter((v) => v.isActive);
    const uniqueDistricts = Array.from(new Set(local.map((v) => v.district))).sort();
    return uniqueDistricts;
  },

  getVillages: async (district?: string): Promise<Village[]> => {
    try {
      const url = district ? `/villages?district=${encodeURIComponent(district)}` : "/villages";
      const response = await apiClient.get<{
        success: boolean;
        data: { villages: Village[] };
      }>(url);
      if (response.data?.data?.villages && response.data.data.villages.length > 0) {
        return response.data.data.villages.map((v: any) => ({
          ...v,
          id: v.id || v._id?.toString() || String(v._id),
        }));
      }
    } catch (_err) {
      // Fallback to local
    }
    let list = getLocalVillages().filter((v) => v.isActive);
    if (district) {
      list = list.filter((v) => v.district.toLowerCase() === district.toLowerCase());
    }
    return list;
  },

  getAdminVillages: async (): Promise<Village[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { villages: Village[] };
      }>("/villages/admin");
      if (response.data?.data?.villages) {
        return response.data.data.villages;
      }
    } catch (_err) {
      // Fallback
    }
    return getLocalVillages();
  },

  createVillage: async (payload: VillagePayload): Promise<Village> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { village: Village };
      }>("/villages", payload);
      if (response.data?.data?.village) {
        return response.data.data.village;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getLocalVillages();
    const newVillage: Village = {
      id: `v-${Date.now()}`,
      name: payload.name,
      district: payload.district,
      pincode: payload.pincode,
      isActive: payload.isActive ?? true,
    };
    current.unshift(newVillage);
    saveLocalVillages(current);
    return newVillage;
  },

  updateVillage: async (id: string, payload: Partial<VillagePayload>): Promise<Village> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { village: Village };
      }>(`/villages/${id}`, payload);
      if (response.data?.data?.village) {
        return response.data.data.village;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getLocalVillages();
    const idx = current.findIndex((v) => v.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...payload };
      saveLocalVillages(current);
      return current[idx];
    }
    return getLocalVillages()[0];
  },

  deleteVillage: async (id: string) => {
    try {
      await apiClient.delete<{ success: boolean }>(`/villages/${id}`);
    } catch (_err) {
      // Fallback
    }

    const current = getLocalVillages().filter((v) => v.id !== id);
    saveLocalVillages(current);
    return { success: true };
  },
};
