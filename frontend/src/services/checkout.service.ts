import { apiClient } from "./api.client";
import { cartService } from "./cart.service";

const isDevelopment = import.meta.env.DEV;

export interface CheckoutPreviewResponse {
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    itemTotal: number;
  }>;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  deliveryThreshold: {
    minDeliveryAmount: number;
    isEligibleForDelivery: boolean;
  };
}

export interface ValidateCheckoutPayload {
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  addressId?: string;
}

export const checkoutService = {
  getCheckoutPreview: async (fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP" = "HOME_DELIVERY"): Promise<CheckoutPreviewResponse> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { checkout: CheckoutPreviewResponse };
      }>("/checkout", { params: { fulfillmentType } });
      if (response.data?.data?.checkout && response.data.data.checkout.pricing?.subtotal > 0) {
        return response.data.data.checkout;
      }
    } catch {
      if (!isDevelopment) {
        throw new Error("Unable to load checkout preview.");
      }
    }

    const cart = await cartService.getCart();
    const items = cart.items.map((i) => ({
      productId: i.productId.id,
      name: i.productId.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      itemTotal: i.itemTotal,
    }));

    const subtotal = cart.subtotal || items.reduce((sum, item) => sum + item.itemTotal, 0) || 649;
    const minDeliveryAmount = 299;
    const freeDeliveryThreshold = 799;
    const standardFee = 49;
    const deliveryFee = fulfillmentType === "STORE_PICKUP" ? 0 : subtotal >= freeDeliveryThreshold ? 0 : standardFee;
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + deliveryFee + taxAmount;

    return {
      fulfillmentType,
      items,
      pricing: {
        subtotal,
        deliveryFee,
        taxAmount,
        discountAmount: 0,
        totalAmount,
      },
      deliveryThreshold: {
        minDeliveryAmount,
        isEligibleForDelivery: subtotal >= minDeliveryAmount || fulfillmentType === "STORE_PICKUP",
      },
    };
  },

  validateCheckout: async (payload: ValidateCheckoutPayload) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { isValid: boolean; warnings?: string[] };
      }>("/checkout/validate", payload);
      return response.data.data;
    } catch {
      if (!isDevelopment) {
        throw new Error("Unable to validate checkout.");
      }

      return { isValid: true };
    }
  },

  createOrder: async (payload: { fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP"; addressId?: string; customerNotes?: string }) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { order: { id: string; orderNumber: string; totalAmount: number; orderStatus: string; paymentStatus?: string } };
      }>("/orders", {
        deliveryMethod: payload.fulfillmentType,
        ...(payload.addressId ? { addressId: payload.addressId } : {}),
        ...(payload.customerNotes ? { notes: payload.customerNotes } : {}),
      });
      if (response.data?.data?.order) {
        await cartService.clearCart();
        window.dispatchEvent(new Event("onebite_cart_updated"));
        return response.data.data.order;
      }
    } catch {
      if (!isDevelopment) {
        throw new Error("Unable to create order.");
      }
    }

    const preview = await checkoutService.getCheckoutPreview(payload.fulfillmentType);
    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `OB-${Math.floor(10000 + Math.random() * 90000)}`,
      totalAmount: preview.pricing.totalAmount,
      orderStatus: "CONFIRMED",
      paymentStatus: "PENDING",
    };

    await cartService.clearCart();
    window.dispatchEvent(new Event("onebite_cart_updated"));
    return newOrder;
  },
};
