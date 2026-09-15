import { apiClient } from "@/services/api.client";
import { type BannerItem, FALLBACK_HERO_BANNERS } from "@/services/banner.service";

const LOCAL_STORAGE_KEY = "theonlinebakery_hero_banners";

export interface BannerPayload {
  title: string;
  subtitle?: string;
  description?: string;
  desktopImage: string;
  mobileImage?: string;
  linkUrl: string;
  buttonText?: string;
  badgeText?: string;
  bgGradient?: string;
  displayOrder?: number;
  isActive?: boolean;
  placement?: string;
}

const getStoredBanners = (): BannerItem[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_e) {
    // Ignore
  }
  return [...FALLBACK_HERO_BANNERS];
};

const saveStoredBanners = (banners: BannerItem[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(banners));
    window.dispatchEvent(new CustomEvent("theonlinebakery_banners_updated"));
  } catch (_e) {
    // Ignore
  }
};

export const adminBannerService = {
  getBanners: async (): Promise<BannerItem[]> => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { banners: any[] };
      }>("/banners/admin");

      if (res.data?.data?.banners) {
        const list = res.data.data.banners.map((b) => ({
          ...b,
          id: b._id || b.id,
        }));
        saveStoredBanners(list);
        return list;
      }
    } catch (_err) {
      // Fallback
    }

    return getStoredBanners();
  },

  getBannerById: async (id: string): Promise<BannerItem | null> => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { banner: any };
      }>(`/banners/${id}`);

      if (res.data?.data?.banner) {
        const b = res.data.data.banner;
        return { ...b, id: b._id || b.id };
      }
    } catch (_err) {
      // Fallback
    }

    const current = getStoredBanners();
    return current.find((b) => b.id === id) || null;
  },

  createBanner: async (payload: BannerPayload): Promise<BannerItem> => {
    try {
      const res = await apiClient.post<{
        success: boolean;
        data: { banner: any };
      }>("/banners", payload);

      if (res.data?.data?.banner) {
        const b = res.data.data.banner;
        const newBanner = { ...b, id: b._id || b.id };
        const list = [newBanner, ...getStoredBanners().filter((item) => item.id !== newBanner.id)];
        saveStoredBanners(list);
        return newBanner;
      }
      throw new Error("Failed to create banner");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to create banner";
      throw new Error(msg);
    }
  },

  updateBanner: async (id: string, payload: Partial<BannerPayload>): Promise<BannerItem> => {
    try {
      const res = await apiClient.put<{
        success: boolean;
        data: { banner: any };
      }>(`/banners/${id}`, payload);

      if (res.data?.data?.banner) {
        const b = res.data.data.banner;
        const updatedBanner = { ...b, id: b._id || b.id };
        const list = getStoredBanners().map((item) => (item.id === id ? updatedBanner : item));
        saveStoredBanners(list);
        return updatedBanner;
      }
      throw new Error("Failed to update banner");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to update banner";
      throw new Error(msg);
    }
  },

  deleteBanner: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/banners/${id}`);
      const current = getStoredBanners();
      const filtered = current.filter((b) => b.id !== id);
      saveStoredBanners(filtered);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete banner";
      throw new Error(msg);
    }
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<BannerItem> => {
    try {
      const res = await apiClient.patch<{
        success: boolean;
        data: { banner: any };
      }>(`/banners/${id}/status`, { isActive });

      if (res.data?.data?.banner) {
        const b = res.data.data.banner;
        const updatedBanner = { ...b, id: b._id || b.id };
        const list = getStoredBanners().map((item) => (item.id === id ? updatedBanner : item));
        saveStoredBanners(list);
        return updatedBanner;
      }
      throw new Error("Failed to toggle banner status");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to toggle banner status";
      throw new Error(msg);
    }
  },

  reorderBanners: async (orderedIds: string[]): Promise<boolean> => {
    try {
      await apiClient.patch("/banners/reorder", { orderedIds });
      const current = getStoredBanners();
      const map = new Map(current.map((b) => [b.id, b]));
      const reordered: BannerItem[] = [];
      orderedIds.forEach((id, idx) => {
        const item = map.get(id);
        if (item) {
          reordered.push({ ...item, displayOrder: idx + 1 });
        }
      });
      saveStoredBanners(reordered);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to reorder banners";
      throw new Error(msg);
    }
  },
};
