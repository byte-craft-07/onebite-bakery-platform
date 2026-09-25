import { type MockReview } from "@/data/mockData";
import { apiClient } from "./api.client";

const LOCAL_REVIEWS_KEY = "onebitebakery_local_reviews";
const LOCAL_RATED_ITEMS_KEY = "onebitebakery_rated_order_items";

export interface ReviewPayload {
  name: string;
  rating: number;
  qualityRating?: number;
  tasteRating?: number;
  comment: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  tags?: string[];
  avatar?: string;
}

export interface ItemQualityRating {
  productId?: string;
  productName: string;
  rating: number;
  qualityRating: number;
  tasteRating?: number;
  tags?: string[];
  comment?: string;
}

export interface OrderRatingPayload {
  orderId: string;
  name?: string;
  overallRating: number;
  deliveryRating?: number;
  overallComment?: string;
  items: ItemQualityRating[];
}

export interface AdminReviewsParams {
  search?: string;
  rating?: number;
  status?: string;
  limit?: number;
  skip?: number;
}

export const reviewService = {
  /**
   * Fetches real reviews from the backend database.
   * If there are no reviews in database, returns [] (STRICTLY NO MOCK FALLBACK).
   */
  getReviews: async (): Promise<MockReview[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { reviews: MockReview[] };
      }>("/reviews");
      const fetched = response.data?.data?.reviews || (response.data as any)?.reviews;
      if (Array.isArray(fetched)) {
        return fetched;
      }
    } catch (_err) {
      // Ignore API errors
    }

    // Check temporary local storage only for reviews submitted in current local session
    try {
      const stored = localStorage.getItem(LOCAL_REVIEWS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_e) {
      // Ignore
    }

    return [];
  },

  /**
   * Submit a new review (Requires login).
   */
  addReview: async (payload: ReviewPayload): Promise<MockReview> => {
    const reviewerName = payload.name || "Customer";
    const dynamicAvatar =
      payload.avatar && payload.avatar.startsWith("http") && !payload.avatar.includes("unsplash.com/photo-1534528741775-53994a69daeb")
        ? payload.avatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=596B58&color=fff&bold=true`;

    const newReview: MockReview = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: reviewerName,
      customerName: reviewerName,
      rating: payload.rating,
      comment: payload.comment,
      productName: payload.productName,
      productId: payload.productId,
      orderId: payload.orderId,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      avatar: dynamicAvatar,
      isVerified: true,
      isActive: true,
    };

    if (payload.orderId && payload.productName) {
      reviewService.markItemAsRated(payload.orderId, payload.productName, {
        productName: payload.productName,
        productId: payload.productId,
        rating: payload.rating,
        qualityRating: payload.qualityRating || payload.rating,
        tasteRating: payload.tasteRating || payload.rating,
        tags: payload.tags,
        comment: payload.comment,
      });
    }

    try {
      const res = await apiClient.post<{ success: boolean; data: { review: MockReview } }>("/reviews", payload);
      if (res.data?.data?.review) {
        const serverReview = res.data.data.review;
        window.dispatchEvent(new Event("onebitebakery_review_submitted"));
        return serverReview;
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        throw new Error("Authentication required. Please log in to submit a review.");
      }
      throw err;
    }

    try {
      const existing = await reviewService.getReviews();
      const updated = [newReview, ...existing];
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));
    } catch (_e) {
      // Ignore
    }

    window.dispatchEvent(new Event("onebitebakery_review_submitted"));
    return newReview;
  },

  /**
   * Submit ratings per order items (Requires login).
   */
  addOrderQualityRating: async (payload: OrderRatingPayload): Promise<MockReview[]> => {
    const reviewerName = payload.name || "Customer";
    const dynamicAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=596B58&color=fff&bold=true`;

    const createdReviews: MockReview[] = [];

    for (const item of payload.items) {
      const itemReview: MockReview = {
        id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: reviewerName,
        customerName: reviewerName,
        rating: item.qualityRating || item.rating || 5,
        comment: item.comment || (item.tags && item.tags.length > 0 ? item.tags.join(" • ") : "Outstanding quality and taste!"),
        productName: item.productName,
        productId: item.productId,
        orderId: payload.orderId,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        avatar: dynamicAvatar,
        isVerified: true,
        isActive: true,
      };
      createdReviews.push(itemReview);

      reviewService.markItemAsRated(payload.orderId, item.productName, item);
    }

    try {
      await apiClient.post("/reviews/batch", {
        orderId: payload.orderId,
        customerName: reviewerName,
        items: payload.items,
      });
    } catch (err: any) {
      if (err.response?.status === 401) {
        throw new Error("Authentication required. Please log in to submit a review.");
      }
      // Fallback
    }

    try {
      const existing = await reviewService.getReviews();
      const updated = [...createdReviews, ...existing];
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));
    } catch (_e) {
      // Ignore
    }

    window.dispatchEvent(new Event("onebitebakery_review_submitted"));
    window.dispatchEvent(new CustomEvent("onebitebakery_order_rated", { detail: { orderId: payload.orderId } }));
    return createdReviews;
  },

  markItemAsRated: (orderId: string, itemKey: string, ratingData: ItemQualityRating) => {
    try {
      const stored = localStorage.getItem(LOCAL_RATED_ITEMS_KEY);
      const map: Record<string, any> = stored ? JSON.parse(stored) : {};
      const key = `${orderId}__${itemKey}`;
      map[key] = {
        ...ratingData,
        ratedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_RATED_ITEMS_KEY, JSON.stringify(map));
    } catch (_e) {
      // Ignore
    }
  },

  getRatedItemData: (orderId: string, itemKey: string): (ItemQualityRating & { ratedAt: string }) | null => {
    try {
      const stored = localStorage.getItem(LOCAL_RATED_ITEMS_KEY);
      if (!stored) return null;
      const map = JSON.parse(stored);
      const key = `${orderId}__${itemKey}`;
      return map[key] || null;
    } catch (_e) {
      return null;
    }
  },

  getOrderRatingsMap: (orderId: string): Record<string, ItemQualityRating & { ratedAt: string }> => {
    try {
      const stored = localStorage.getItem(LOCAL_RATED_ITEMS_KEY);
      if (!stored) return {};
      const map = JSON.parse(stored);
      const result: Record<string, any> = {};
      const prefix = `${orderId}__`;
      Object.keys(map).forEach((k) => {
        if (k.startsWith(prefix)) {
          const itemKey = k.replace(prefix, "");
          result[itemKey] = map[k];
        }
      });
      return result;
    } catch (_e) {
      return {};
    }
  },

  /**
   * Calculate live rating from real reviews.
   */
  getProductRating: (product: {
    id?: string;
    name?: string;
    slug?: string;
    rating?: number;
    reviewCount?: number;
  }): { rating: number; reviewCount: number } => {
    const pName = (product.name || "").toLowerCase().trim();
    const pId = (product.id || "").toLowerCase().trim();
    const pSlug = (product.slug || "").toLowerCase().trim();

    try {
      const storedReviewsRaw = localStorage.getItem(LOCAL_REVIEWS_KEY);
      const reviews: any[] = storedReviewsRaw ? JSON.parse(storedReviewsRaw) : [];

      const storedRatedItemsRaw = localStorage.getItem(LOCAL_RATED_ITEMS_KEY);
      const ratedItemsMap: Record<string, any> = storedRatedItemsRaw ? JSON.parse(storedRatedItemsRaw) : {};

      const matchedRatings: number[] = [];

      reviews.forEach((r) => {
        const rProd = (r.productName || r.product_name || "").toLowerCase().trim();
        const rProdId = (r.productId || "").toLowerCase().trim();
        if (
          (pName && rProd && (pName.includes(rProd) || rProd.includes(pName))) ||
          (pId && rProdId && pId === rProdId) ||
          (pSlug && rProd && pSlug.includes(rProd))
        ) {
          if (typeof r.rating === "number" && r.rating > 0) {
            matchedRatings.push(r.rating);
          }
        }
      });

      Object.values(ratedItemsMap).forEach((item: any) => {
        const itemProd = (item.productName || "").toLowerCase().trim();
        const itemProdId = (item.productId || "").toLowerCase().trim();
        if (
          (pName && itemProd && (pName.includes(itemProd) || itemProd.includes(pName))) ||
          (pId && itemProdId && pId === itemProdId)
        ) {
          const rVal = item.qualityRating || item.rating;
          if (typeof rVal === "number" && rVal > 0) {
            matchedRatings.push(rVal);
          }
        }
      });

      if (matchedRatings.length > 0) {
        const averageRating = matchedRatings.reduce((sum, v) => sum + v, 0) / matchedRatings.length;
        return {
          rating: Math.round(averageRating * 10) / 10,
          reviewCount: matchedRatings.length,
        };
      }

      // If no real ratings exist, return 0 reviews
      return {
        rating: 0,
        reviewCount: 0,
      };
    } catch (_e) {
      return { rating: 0, reviewCount: 0 };
    }
  },

  /**
   * Only returns real reviews matching the product. Strictly no fake reviews.
   */
  getProductReviews: async (product: {
    id?: string;
    name?: string;
    slug?: string;
  }): Promise<MockReview[]> => {
    const pName = (product.name || "").toLowerCase().trim();
    const pId = (product.id || "").toLowerCase().trim();
    const pSlug = (product.slug || "").toLowerCase().trim();

    const allReviews = await reviewService.getReviews();
    return allReviews.filter((r) => {
      const rProd = (r.productName || (r as any).product_name || "").toLowerCase().trim();
      const rProdId = ((r as any).productId || "").toLowerCase().trim();
      return (
        (pName && rProd && (pName.includes(rProd) || rProd.includes(pName))) ||
        (pId && rProdId && pId === rProdId) ||
        (pSlug && rProd && pSlug.includes(rProd))
      );
    });
  },

  /**
   * Admin: Get all reviews from Database (both active and hidden)
   */
  getAdminReviews: async (params?: AdminReviewsParams): Promise<{ reviews: MockReview[]; total: number }> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { reviews: MockReview[]; total: number };
      }>("/reviews/admin/all", { params });
      return response.data?.data || { reviews: [], total: 0 };
    } catch (_err) {
      return { reviews: [], total: 0 };
    }
  },

  /**
   * Admin: Toggle visibility (active/hidden) of review
   */
  toggleReviewStatus: async (id: string): Promise<{ id: string; isActive: boolean }> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { id: string; isActive: boolean };
    }>(`/reviews/admin/${id}/toggle-status`);
    return response.data?.data;
  },

  /**
   * Admin: Delete review permanently
   */
  deleteReview: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/reviews/admin/${id}`);
    return response.data?.success ?? true;
  },
};
