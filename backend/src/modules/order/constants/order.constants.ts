export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "PREPARING",
  "READY",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["UPI", "COD"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DELIVERY_METHODS = ["HOME_DELIVERY", "STORE_PICKUP"] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "PACKED", "CANCELLED"],
  CONFIRMED: ["PACKED", "PREPARING", "OUT_FOR_DELIVERY", "CANCELLED"],
  PACKED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  PREPARING: ["PACKED", "READY", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  READY_FOR_PICKUP: ["DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};
