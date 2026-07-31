import { apiClient } from "./api.client";

export interface CheckoutPreviewResponse {
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    itemTotal: number;
  }>;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  deliveryThreshold: {
    minDeliveryAmount: number;
    isEligibleForDelivery: boolean;
  };
}

export interface ValidateCheckoutPayload {
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  addressId?: string;
}

export const checkoutService = {
  getCheckoutPreview: async (fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP" = "HOME_DELIVERY"): Promise<CheckoutPreviewResponse> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { checkout: CheckoutPreviewResponse };
    }>("/checkout", { params: { fulfillmentType } });
    return response.data.data.checkout;
  },

  validateCheckout: async (payload: ValidateCheckoutPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { isValid: boolean; warnings?: string[] };
    }>("/checkout/validate", payload);
    return response.data.data;
  },

  createOrder: async (payload: { fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP"; addressId?: string; customerNotes?: string }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { order: { id: string; orderNumber: string; totalAmount: number; orderStatus: string } };
    }>("/orders", payload);
    return response.data.data.order;
  },
};
