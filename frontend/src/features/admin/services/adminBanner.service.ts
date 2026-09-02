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
        const list = [newBanner, ...getStoredBanners()];
        saveStoredBanners(list);
        return newBanner;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getStoredBanners();
    const newBanner: BannerItem = {
      ...payload,
      id: `banner-${Date.now()}`,
      displayOrder: payload.displayOrder ?? current.length + 1,
      isActive: payload.isActive ?? true,
      buttonText: payload.buttonText || "Explore All Products",
      badgeText: payload.badgeText || "Freshly Baked Daily",
      linkUrl: payload.linkUrl || "/products",
      bgGradient: payload.bgGradient || "from-[#FFF8EC] via-[#FFF8EC] to-[#FFF8EC]",
      createdAt: new Date().toISOString(),
    };
    const updated = [...current, newBanner];
    saveStoredBanners(updated);
    return newBanner;
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
    } catch (_err) {
      // Fallback
    }

    const current = getStoredBanners();
    const updated = current.map((b) => (b.id === id ? { ...b, ...payload } : b));
    saveStoredBanners(updated);
    return updated.find((b) => b.id === id) as BannerItem;
  },

  deleteBanner: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/banners/${id}`);
    } catch (_err) {
      // Fallback
    }

    const current = getStoredBanners();
    const filtered = current.filter((b) => b.id !== id);
    saveStoredBanners(filtered);
    return true;
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
    } catch (_err) {
      // Fallback
    }

    const current = getStoredBanners();
    const updated = current.map((b) => (b.id === id ? { ...b, isActive } : b));
    saveStoredBanners(updated);
    return updated.find((b) => b.id === id) as BannerItem;
  },

  reorderBanners: async (orderedIds: string[]): Promise<boolean> => {
    try {
      await apiClient.patch("/banners/reorder", { orderedIds });
    } catch (_err) {
      // Fallback
    }

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
  },
};
