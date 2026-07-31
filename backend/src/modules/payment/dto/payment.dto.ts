import type { PaymentProviderType } from "../constants/index.js";

export interface CreatePaymentDto {
  orderId: string;
  provider?: PaymentProviderType;
}

export interface VerifyPaymentDto {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
