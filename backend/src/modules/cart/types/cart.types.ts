import type { ProductType } from "../../product/constants/index.js";
import type { CustomCakeConfig, ProductSnapshot } from "../model/index.js";

export interface CartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  unitPriceSnapshot: number;
  unitPrice: number;
  totalPrice: number;
  productType: ProductType;
  customization?: CustomCakeConfig;
  customCakeConfig?: CustomCakeConfig;
  productSnapshot: ProductSnapshot;
  addedAt: Date;
  selectedVariant?: Record<string, unknown>;
  notes?: string;
}

export interface CartResponse {
  id: string;
  userId?: string;
  customerId?: string;
  sessionId?: string;
  items: CartItemResponse[];
  totalItems: number;
  subtotal: number;
  estimatedDiscount: number;
  estimatedTax: number;
  estimatedDeliveryCharge: number;
  grandTotal: number;
  homeDeliveryAvailable: boolean;
  pickupAvailable: boolean;
  appliedOffers: string[];
  createdAt: Date;
  updatedAt: Date;
}
