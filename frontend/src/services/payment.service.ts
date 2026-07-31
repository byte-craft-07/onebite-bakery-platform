import { apiClient } from "./api.client";

export interface InitiatePaymentPayload {
  orderId: string;
  provider?: "RAZORPAY";
}

export interface InitiatePaymentResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  providerOrderId: string;
  keyId?: string;
}

export interface VerifyPaymentPayload {
  paymentId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export const paymentService = {
  initiatePayment: async (payload: InitiatePaymentPayload): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { payment: InitiatePaymentResponse };
    }>("/payments/initiate", payload);
    return response.data.data.payment;
  },

  verifyPayment: async (payload: VerifyPaymentPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { isVerified: boolean; orderId: string };
    }>("/payments/verify", payload);
    return response.data.data;
  },
};
