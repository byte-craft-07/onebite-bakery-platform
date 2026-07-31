import type { DeliveryMethod } from "../../order/constants/index.js";
import type { ProductType } from "../../product/constants/index.js";

export interface CheckoutItemSummary {
  productId: string;
  productName: string;
  productType: ProductType;
  quantity: number;
  unitPriceSnapshot: number;
  totalPrice: number;
  isAvailable: boolean;
}

export interface CheckoutSummaryResponse {
  cartId: string;
  items: CheckoutItemSummary[];
  subtotal: number;
  totalItems: number;
  eligibleDeliveryMethods: DeliveryMethod[];
  homeDeliveryEligible: boolean;
  pickupEligible: boolean;
  minimumHomeDeliveryAmount: number;
  selectedDeliveryMethod?: DeliveryMethod;
  selectedAddress?: Record<string, unknown>;
  validationErrors: string[];
  warnings: string[];
}

export interface ValidateCheckoutResponse {
  isValid: boolean;
  cartId: string;
  subtotal: number;
  totalItems: number;
  deliveryMethod: DeliveryMethod;
  validationErrors: string[];
  warnings: string[];
}
