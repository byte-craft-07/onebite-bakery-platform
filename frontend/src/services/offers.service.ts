import { apiClient } from "./api.client";
import { type AdminCoupon } from "@/features/admin/services/adminCoupons.service";

export type OfferCoupon = AdminCoupon;

export const DEFAULT_OFFERS: OfferCoupon[] = [
  {
    id: "cpn-navratri",
    code: "NAVRATRI20",
    description: "FLAT ₹20 OFF 🌸 नवरात्रि विशेष ऑफर — ऑर्डर करते समय NAVRATRI20 कूपन कोड का उपयोग करें",
    discountType: "FLAT",
    discountValue: 20,
    minOrderAmount: 250,
    startDate: "2026-10-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn-welcome",
    code: "WELCOME100",
    description: "Flat ₹100 Off on your first celebration bakery order above ₹499",
    discountType: "FLAT",
    discountValue: 100,
    minOrderAmount: 499,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn-cake20",
    code: "CAKE20",
    description: "Get 20% instant discount on all celebration cakes & party dessert combos (Max ₹250)",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 599,
    maxDiscountAmount: 250,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn-sweet50",
    code: "ONLINE50",
    description: "Flat ₹50 Off on artisanal sourdough bread, croissants, and chocolate cookies",
    discountType: "FLAT",
    discountValue: 50,
    minOrderAmount: 299,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const offersService = {
  getActiveOffers: async (): Promise<OfferCoupon[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { coupons: OfferCoupon[] } }>("/coupons");
      if (res.data?.data?.coupons && res.data.data.coupons.length > 0) {
        return res.data.data.coupons
          .filter((c) => c.isActive)
          .map((c) => ({
            ...c,
            id: c.id || c._id || "",
          }));
      }
    } catch (_err) {
      // Fallback
    }
    return DEFAULT_OFFERS;
  },
};
