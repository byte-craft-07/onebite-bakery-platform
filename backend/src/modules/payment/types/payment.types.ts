import type {
  PaymentProviderType,
  PaymentRecordStatus,
} from "../constants/index.js";

export interface CreatePaymentResponse {
  paymentId: string;
  orderId: string;
  provider: PaymentProviderType;
  providerOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  paymentStatus: PaymentRecordStatus;
  message: string;
}

export interface PaymentDetailsResponse {
  id: string;
  orderId: string;
  userId: string;
  provider: PaymentProviderType;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentRecordStatus;
  paymentMethod?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
