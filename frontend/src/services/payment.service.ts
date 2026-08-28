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
  razorpayKeyId?: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  paymentStatus: string;
  message: string;
}

export const paymentService = {
  initiatePayment: async (payload: InitiatePaymentPayload): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { payment: InitiatePaymentResponse };
    }>("/payments/create", payload);
    return response.data.data.payment;
  },

  verifyPayment: async (payload: VerifyPaymentPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { payment: VerifyPaymentResponse };
    }>("/payments/verify", payload);
    return response.data.data.payment;
  },
};
