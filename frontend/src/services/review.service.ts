import { MOCK_REVIEWS, type MockReview } from "@/data/mockData";
import { apiClient } from "./api.client";

const LOCAL_REVIEWS_KEY = "onebite_local_reviews";

export interface ReviewPayload {
  name: string;
  rating: number;
  comment: string;
  orderId?: string;
  productName?: string;
  avatar?: string;
}

export const reviewService = {
  getReviews: async (): Promise<MockReview[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { reviews: MockReview[] };
      }>("/reviews");
      const fetched = response.data?.data?.reviews || (response.data as any)?.reviews;
      if (fetched && fetched.length > 0) {
        return fetched;
      }
    } catch (_err) {
      // Ignore API errors and fallback to local storage
    }

    try {
      const stored = localStorage.getItem(LOCAL_REVIEWS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_e) {
      // Ignore
    }

    return MOCK_REVIEWS;
  },

  addReview: async (payload: ReviewPayload): Promise<MockReview> => {
    const newReview: MockReview = {
      id: `rev-${Date.now()}`,
      name: payload.name || "Verified Customer",
      rating: payload.rating,
      comment: payload.comment,
      date: new Date().toISOString(),
      avatar:
        payload.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    };

    try {
      await apiClient.post<{ review: MockReview }>("/reviews", payload);
    } catch (_err) {
      // Ignore API error and persist locally
    }

    try {
      const existing = await reviewService.getReviews();
      const updated = [newReview, ...existing];
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));
    } catch (_e) {
      // Ignore
    }

    window.dispatchEvent(new Event("onebite_review_submitted"));
    return newReview;
  },
};
