import { apiClient } from "./api.client";
import { type AdminCoupon } from "@/features/admin/services/adminCoupons.service";

export type OfferCoupon = AdminCoupon;

export const offersService = {
  getActiveOffers: async (): Promise<OfferCoupon[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { coupons: OfferCoupon[] } }>("/coupons");
      const coupons = res.data?.data?.coupons;
      if (Array.isArray(coupons)) {
        return coupons
          .filter((c) => c && c.isActive)
          .map((c) => ({
            ...c,
            id: c.id || c._id || "",
          }));
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch coupons from database:", err);
      return [];
    }
  },
};

