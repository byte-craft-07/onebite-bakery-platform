import { apiClient } from "./api.client";

export interface BannerItem {
  id: string;
  _id?: string;
  title: string;
  desktopImage: string;
  mobileImage?: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
  placement?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  badgeText?: string;
  bgGradient?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const FALLBACK_HERO_BANNERS: BannerItem[] = [];

const LOCAL_STORAGE_KEY = "onebitebakery_hero_banners";

export const bannerService = {
  getStoredBannersSync: (placement: string = "home_hero"): BannerItem[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const active = parsed.filter(
            (b: BannerItem) => b.isActive && (!placement || !b.placement || b.placement === placement)
          );
          return active.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        }
      }
    } catch (_err) {
      // Ignore
    }
    return [];
  },

  getActiveBanners: async (placement: string = "home_hero"): Promise<BannerItem[]> => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { banners: any[] };
      }>("/banners", { params: { placement } });

      if (res.data?.success && Array.isArray(res.data?.data?.banners)) {
        const list = res.data.data.banners.map((b) => ({
          ...b,
          id: b._id || b.id,
        }));
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
        } catch (_e) {
          // LocalStorage save error
        }
        return list;
      }
    } catch (_err) {
      // Network or API error fallback to local storage
    }

    return bannerService.getStoredBannersSync(placement);
  },
};

