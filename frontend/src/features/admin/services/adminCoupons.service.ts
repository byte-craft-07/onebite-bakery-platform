import { apiClient } from "@/services/api.client";

export interface AdminCoupon {
  id: string;
  _id?: string;
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  isActive?: boolean;
}

export const adminCouponsService = {
  getCoupons: async (): Promise<AdminCoupon[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { coupons: AdminCoupon[] } }>("/coupons");
      if (res.data?.data?.coupons) {
        return res.data.data.coupons.map((c) => ({
          ...c,
          id: c.id || c._id || "",
        }));
      }
    } catch (_err) {
      // Return local fallback if API fails
    }
    return getLocalCoupons();
  },

  createCoupon: async (payload: CreateCouponPayload): Promise<AdminCoupon> => {
    try {
      const res = await apiClient.post<{ success: boolean; data: { coupon: AdminCoupon } }>("/coupons", payload);
      if (res.data?.data?.coupon) {
        const created = res.data.data.coupon;
        return { ...created, id: created.id || created._id || "" };
      }
      throw new Error("Failed to create coupon");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to create coupon";
      throw new Error(msg);
    }
  },

  toggleCouponStatus: async (id: string): Promise<AdminCoupon> => {
    try {
      const res = await apiClient.patch<{ success: boolean; data: { coupon: AdminCoupon } }>(`/coupons/${id}/toggle`);
      if (res.data?.data?.coupon) {
        const updated = res.data.data.coupon;
        return { ...updated, id: updated.id || updated._id || "" };
      }
      return toggleLocalCoupon(id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to toggle coupon status";
      throw new Error(msg);
    }
  },

  deleteCoupon: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/coupons/${id}`);
      deleteLocalCoupon(id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete coupon";
      throw new Error(msg);
    }
  },
};

const LOCAL_COUPONS_KEY = "theonlinebakery_mock_coupons";

const INITIAL_MOCK_COUPONS: AdminCoupon[] = [
  {
    id: "cpn_1",
    code: "WELCOME100",
    description: "₹100 FLAT discount on first orders above ₹499",
    discountType: "FLAT",
    discountValue: 100,
    minOrderAmount: 499,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usageLimit: 500,
    usedCount: 42,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn_2",
    code: "SWEET20",
    description: "20% OFF on all bakery items (Max discount ₹150)",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 299,
    maxDiscountAmount: 150,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usageLimit: 1000,
    usedCount: 128,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn_3",
    code: "FESTIVE50",
    description: "Flat ₹50 OFF for minimum order of ₹299",
    discountType: "FLAT",
    discountValue: 50,
    minOrderAmount: 299,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    usedCount: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

function getLocalCoupons(): AdminCoupon[] {
  try {
    const raw = localStorage.getItem(LOCAL_COUPONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_e) {
    // Ignore
  }
  localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(INITIAL_MOCK_COUPONS));
  return INITIAL_MOCK_COUPONS;
}

function saveLocalCoupon(coupon: AdminCoupon) {
  const coupons = getLocalCoupons();
  const updated = [coupon, ...coupons.filter((c) => c.code !== coupon.code)];
  localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(updated));
}

function toggleLocalCoupon(id: string): AdminCoupon {
  const coupons = getLocalCoupons();
  let target = coupons.find((c) => c.id === id);
  if (target) {
    target.isActive = !target.isActive;
    localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(coupons));
  } else {
    target = {
      id,
      code: "UNKNOWN",
      discountType: "FLAT",
      discountValue: 0,
      minOrderAmount: 0,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }
  return target;
}

function deleteLocalCoupon(id: string) {
  const coupons = getLocalCoupons();
  const updated = coupons.filter((c) => c.id !== id);
  localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(updated));
}
