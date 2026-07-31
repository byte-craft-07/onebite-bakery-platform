export const PAYMENT_RECORD_STATUSES = [
  "PENDING",
  "CREATED",
  "AUTHORIZED",
  "CAPTURED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

export const PAYMENT_PROVIDERS = [
  "RAZORPAY",
  "COD",
  "UPI",
  "STRIPE",
] as const;

export type PaymentProviderType = (typeof PAYMENT_PROVIDERS)[number];
