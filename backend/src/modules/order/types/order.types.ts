import type { CartResponse } from "../../cart/index.js";
import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../constants/index.js";
import type {
  OrderAddressSnapshot,
  OrderBranchSnapshot,
  OrderItemSnapshot,
  OrderLocationSnapshot,
  OrderPricingSnapshot,
} from "../model/index.js";

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  branchId?: string;
  deliveryAgentId?: string;
  items: OrderItemSnapshot[];
  addressSnapshot?: OrderAddressSnapshot;
  locationSnapshot?: OrderLocationSnapshot;
  branchSnapshot?: OrderBranchSnapshot;
  deliveryAgentSnapshot?: {
    agentId: string;
    name: string;
    phone?: string;
  };
  pricingSnapshot: OrderPricingSnapshot;
  deliveryMethod: DeliveryMethod;
  paymentMethod?: PaymentMethod;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  deliveryTimingType?: "INSTANT" | "SCHEDULED";
  deliveryTimePreference?: string;
  estimatedReadyTime?: Date;
  scheduledDate?: Date;
  scheduledTimeSlot?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  deliveryStartedAt?: Date;
  deliveredAt?: Date;
  deliveryCompletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReorderResultResponse {
  cart: CartResponse;
  skippedItems: string[];
}
