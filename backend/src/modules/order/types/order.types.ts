import type { CartResponse } from "../../cart/index.js";
import type {
  DeliveryMethod,
  OrderStatus,
  PaymentStatus,
} from "../constants/index.js";
import type {
  OrderAddressSnapshot,
  OrderItemSnapshot,
  OrderPricingSnapshot,
} from "../model/index.js";

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItemSnapshot[];
  addressSnapshot?: OrderAddressSnapshot;
  pricingSnapshot: OrderPricingSnapshot;
  deliveryMethod: DeliveryMethod;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  estimatedReadyTime?: Date;
  scheduledDate?: Date;
  scheduledTimeSlot?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReorderResultResponse {
  cart: CartResponse;
  skippedItems: string[];
}
