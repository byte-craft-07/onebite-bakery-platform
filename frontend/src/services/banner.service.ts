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

export const FALLBACK_HERO_BANNERS: BannerItem[] = [
  {
    id: "poster-1",
    title: "Artisanal Celebration Cakes & Belgian Truffle",
    desktopImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&h=650&q=85",
    mobileImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&h=450&q=85",
    linkUrl: "/products",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "poster-2",
    title: "Custom 3D & Tier Designer Cakes Studio",
    desktopImage: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=1600&h=650&q=85",
    mobileImage: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&h=450&q=85",
    linkUrl: "/custom-cake",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "poster-3",
    title: "Fresh Artisanal Breads & French Pastries",
    desktopImage: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1600&h=650&q=85",
    mobileImage: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&h=450&q=85",
    linkUrl: "/categories",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "poster-4",
    title: "Celebration Party Combos & Sparkler Hamper",
    desktopImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1600&h=650&q=85",
    mobileImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&h=450&q=85",
    linkUrl: "/combos",
    displayOrder: 4,
    isActive: true,
  },
];

const LOCAL_STORAGE_KEY = "onebitebakery_hero_banners";

export const bannerService = {
  getStoredBannersSync: (placement: string = "home_hero"): BannerItem[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const active = parsed.filter(
            (b: BannerItem) => b.isActive && (!placement || !b.placement || b.placement === placement)
          );
          if (active.length > 0) {
            return active.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          }
        }
      }
    } catch (_err) {
      // Ignore
    }
    return FALLBACK_HERO_BANNERS;
  },

  getActiveBanners: async (placement: string = "home_hero"): Promise<BannerItem[]> => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { banners: any[] };
      }>("/banners", { params: { placement } });

      if (res.data?.data?.banners && res.data.data.banners.length > 0) {
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
      // Fallback
    }

    return bannerService.getStoredBannersSync(placement);
  },
};
