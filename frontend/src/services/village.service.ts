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

const LOCAL_VILLAGES_KEY = "onebitebakery_local_villages";

const DEFAULT_VILLAGES: Village[] = [
  { id: "v1", name: "Terha", district: "Hamirpur", pincode: "210502", isActive: true, deliveryCharge: 49, freeDeliveryThreshold: 799 },
  { id: "v2", name: "Hamirpur Town", district: "Hamirpur", pincode: "210502", isActive: true, deliveryCharge: 49, freeDeliveryThreshold: 799 },
  { id: "v3", name: "Kurara", district: "Hamirpur", pincode: "210502", isActive: true, deliveryCharge: 49, freeDeliveryThreshold: 799 },
  { id: "v4", name: "Sumerpur", district: "Hamirpur", pincode: "210502", isActive: true, deliveryCharge: 49, freeDeliveryThreshold: 799 },
  { id: "v5", name: "Maudaha", district: "Hamirpur", pincode: "210507", isActive: true, deliveryCharge: 49, freeDeliveryThreshold: 799 },
];

const getLocalVillages = (): Village[] => {
  try {
    const raw = localStorage.getItem(LOCAL_VILLAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
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
      // Fallback for offline mode
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
      if (response.data?.data?.villages) {
        const mapped = response.data.data.villages.map((v: any) => ({
          ...v,
          id: v.id || v._id?.toString() || String(v._id),
        }));
        return mapped;
      }
    } catch (_err) {
      // Fallback for offline mode
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
        const mapped = response.data.data.villages.map((v: any) => ({
          ...v,
          id: v.id || v._id?.toString() || String(v._id),
        }));
        if (mapped.length > 0) {
          saveLocalVillages(mapped);
          return mapped;
        }
      }
    } catch (_err) {
      // Graceful fallback to local mock data
    }
    return getLocalVillages();
  },

  createVillage: async (payload: VillagePayload): Promise<Village> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { village: Village };
      }>("/villages", payload);
      const v = response.data.data.village as any;
      const created: Village = {
        ...v,
        id: v.id || v._id?.toString() || String(v._id),
      };
      const local = getLocalVillages();
      saveLocalVillages([created, ...local]);
      return created;
    } catch (err: any) {
      const localNew: Village = {
        id: "v_" + Date.now(),
        name: payload.name,
        district: payload.district,
        pincode: payload.pincode,
        deliveryCharge: payload.deliveryCharge ?? 49,
        freeDeliveryThreshold: payload.freeDeliveryThreshold ?? 799,
        isActive: payload.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const local = getLocalVillages();
      saveLocalVillages([localNew, ...local]);
      return localNew;
    }
  },

  updateVillage: async (id: string, payload: Partial<VillagePayload>): Promise<Village> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { village: Village };
      }>(`/villages/${id}`, payload);
      const v = response.data.data.village as any;
      const updated: Village = {
        ...v,
        id: v.id || v._id?.toString() || String(v._id),
      };
      const local = getLocalVillages();
      const updatedList = local.map((item) => (item.id === id ? { ...item, ...updated } : item));
      saveLocalVillages(updatedList);
      return updated;
    } catch (_err) {
      const local = getLocalVillages();
      let updatedTarget: Village | undefined;
      const updatedList = local.map((item) => {
        if (item.id === id) {
          updatedTarget = { ...item, ...payload, updatedAt: new Date().toISOString() };
          return updatedTarget;
        }
        return item;
      });
      saveLocalVillages(updatedList);
      return updatedTarget || ({ id, ...payload } as Village);
    }
  },

  deleteVillage: async (id: string) => {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/villages/${id}`);
      const local = getLocalVillages();
      saveLocalVillages(local.filter((v) => v.id !== id));
      return response.data;
    } catch (_err) {
      const local = getLocalVillages();
      saveLocalVillages(local.filter((v) => v.id !== id));
      return { success: true };
    }
  },
};
