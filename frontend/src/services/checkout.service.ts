import { apiClient } from "./api.client";
import { cartService } from "./cart.service";

const isDevelopment = import.meta.env.DEV;

export interface DirectOrderItem {
  productId: string;
  name: string;
  slug?: string;
  price: number;
  quantity: number;
  mainImage?: string;
  customization?: {
    message?: string;
    eggless?: boolean;
  };
  itemTotal: number;
}

export interface CheckoutPreviewResponse {
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  items: Array<{
    productId: string;
    name: string;
    image?: string;
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
  getCheckoutPreview: async (
    fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP" = "HOME_DELIVERY",
    addressId?: string,
    villageName?: string,
    directItem?: DirectOrderItem | null,
  ): Promise<CheckoutPreviewResponse> => {
    const cart = await cartService.getCart();

    // Resolve villageName if not provided
    if (!villageName) {
      try {
        const { authService } = await import("./auth.service");
        const loc = authService.getStoredLocation();
        if (loc?.villageName) {
          villageName = loc.villageName;
        }
      } catch (_err) {
        // Fallback
      }
    }

    let backendPreview: CheckoutPreviewResponse | null = null;
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { checkout: CheckoutPreviewResponse };
      }>("/checkout", {
        params: {
          deliveryMethod: fulfillmentType,
          addressId,
          villageName,
        },
      });
      if (response.data?.data?.checkout && response.data.data.checkout.pricing?.subtotal > 0) {
        backendPreview = response.data.data.checkout;
      }
    } catch {
      // Ignore API failure in local dev
    }

    let items: CheckoutPreviewResponse["items"] = [];
    let subtotal = 0;
    let discountAmount = 0;

    if (directItem) {
      items = [
        {
          productId: directItem.productId,
          name: directItem.name,
          image: directItem.mainImage,
          quantity: directItem.quantity,
          unitPrice: directItem.price,
          itemTotal: directItem.itemTotal,
        },
      ];
      subtotal = directItem.itemTotal;
      discountAmount = 0;
    } else {
      items = backendPreview?.items || cart.items.map((i) => ({
        productId: i.productId.id,
        name: i.productId.name,
        image: i.productId.mainImage,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        itemTotal: i.itemTotal,
      }));

      subtotal = backendPreview?.pricing?.subtotal || cart.subtotal || items.reduce((sum, item) => sum + item.itemTotal, 0) || 0;
      discountAmount = Math.round((cart.discountAmount || cart.couponDiscount || backendPreview?.pricing?.discountAmount || 0) * 100) / 100;
    }

    let storeSettings = {
      minOrderValue: 299,
      freeDeliveryThreshold: 799,
      standardDeliveryCharge: 49,
      taxRatePercent: 5,
      isTaxEnabled: true,
    };

    try {
      const { adminOperationsService } = await import("@/features/admin/services/adminOperations.service");
      const fetched = await adminOperationsService.getSettings();
      if (fetched) {
        storeSettings = {
          minOrderValue: fetched.minOrderValue ?? 299,
          freeDeliveryThreshold: fetched.freeDeliveryThreshold ?? 799,
          standardDeliveryCharge: fetched.standardDeliveryCharge ?? 49,
          taxRatePercent: fetched.taxRatePercent ?? 5,
          isTaxEnabled: fetched.isTaxEnabled ?? true,
        };
      }
    } catch (_err) {
      // Use fallback
    }

    // Try finding village specific delivery charge
    let villageDeliveryCharge: number | undefined;
    let villageFreeThreshold: number | undefined;

    if (villageName) {
      try {
        const { villageService } = await import("./village.service");
        const villages = await villageService.getVillages();
        const matched = villages.find((v) => v.name.toLowerCase() === villageName.toLowerCase());
        if (matched) {
          if (matched.deliveryCharge !== undefined) villageDeliveryCharge = matched.deliveryCharge;
          if (matched.freeDeliveryThreshold !== undefined) villageFreeThreshold = matched.freeDeliveryThreshold;
        }
      } catch (_err) {
        // Fallback
      }
    }

    const minDeliveryAmount = storeSettings.minOrderValue;
    const freeDeliveryThreshold = villageFreeThreshold ?? storeSettings.freeDeliveryThreshold;
    const standardFee =
      villageDeliveryCharge !== undefined
        ? villageDeliveryCharge
        : (backendPreview?.pricing?.deliveryFee !== undefined
        ? backendPreview.pricing.deliveryFee
        : storeSettings.standardDeliveryCharge);

    const deliveryFee =
      fulfillmentType === "STORE_PICKUP"
        ? 0
        : subtotal >= freeDeliveryThreshold
        ? 0
        : standardFee;

    const taxAmount = 0;
    const totalAmount = Math.max(0, Math.round((subtotal - discountAmount + deliveryFee) * 100) / 100);

    return {
      fulfillmentType,
      items,
      pricing: {
        subtotal,
        deliveryFee,
        taxAmount: 0,
        discountAmount,
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

  createOrder: async (payload: {
    fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
    paymentMethod?: "UPI" | "COD";
    addressId?: string;
    customerNotes?: string;
    deliveryTimingType?: "INSTANT" | "SCHEDULED";
    deliveryTimePreference?: string;
    scheduledDate?: string;
    scheduledTimeSlot?: string;
    directItem?: DirectOrderItem | null;
  }) => {
    let originalLocalCartJson: string | null = null;
    try {
      if (payload.directItem) {
        // Save current cart backup so cart items are NOT lost
        originalLocalCartJson = localStorage.getItem("onebitebakery_local_cart");
        // Clear backend cart first so stale items are not mixed
        try {
          await apiClient.delete("/cart");
        } catch (_e) {
          // Ignore
        }

        // Temporarily prepare cart for this direct order
        const tempCart = {
          id: "temp_direct_cart",
          items: [
            {
              id: "direct_item_1",
              productId: {
                id: payload.directItem.productId,
                name: payload.directItem.name,
                slug: payload.directItem.slug || "",
                price: payload.directItem.price,
                mainImage: payload.directItem.mainImage,
                isAvailable: true,
              },
              quantity: payload.directItem.quantity,
              unitPrice: payload.directItem.price,
              itemTotal: payload.directItem.itemTotal,
              customization: payload.directItem.customization,
            },
          ],
          subtotal: payload.directItem.itemTotal,
          itemCount: payload.directItem.quantity,
        };
        localStorage.setItem("onebitebakery_local_cart", JSON.stringify(tempCart));

        try {
          await apiClient.post("/cart/items", {
            productId: payload.directItem.productId,
            quantity: payload.directItem.quantity,
          });
        } catch (_e) {
          // Ignore
        }
      } else {
        const localCart = await cartService.getCart();
        if (localCart.items && localCart.items.length > 0) {
          try {
            await apiClient.delete("/cart");
          } catch (_e) {
            // Ignore
          }
          for (const item of localCart.items) {
            try {
              await apiClient.post("/cart/items", {
                productId: item.productId.id,
                quantity: item.quantity,
              });
            } catch (_e) {
              // Ignore single item sync failure
            }
          }
        }
      }
    } catch (_err) {
      // Continue to create order
    }

    const response = await apiClient.post<{
      success: boolean;
      data: { order: any };
    }>("/orders", {
      deliveryMethod: payload.fulfillmentType,
      paymentMethod: payload.paymentMethod ?? "UPI",
      ...(payload.addressId ? { addressId: payload.addressId } : {}),
      ...(payload.customerNotes ? { notes: payload.customerNotes } : {}),
      ...(payload.deliveryTimingType ? { deliveryTimingType: payload.deliveryTimingType } : {}),
      ...(payload.deliveryTimePreference ? { deliveryTimePreference: payload.deliveryTimePreference } : {}),
      ...(payload.scheduledDate ? { scheduledDate: payload.scheduledDate } : {}),
      ...(payload.scheduledTimeSlot ? { scheduledTimeSlot: payload.scheduledTimeSlot } : {}),
    });

    if (response.data?.data?.order) {
      if (payload.directItem) {
        // RESTORE original cart so cart items remain safe!
        if (originalLocalCartJson) {
          localStorage.setItem("onebitebakery_local_cart", originalLocalCartJson);
        } else {
          localStorage.removeItem("onebitebakery_local_cart");
        }
        sessionStorage.removeItem("onebitebakery_direct_order_item");
        window.dispatchEvent(new Event("onebitebakery_cart_updated"));
      } else {
        await cartService.clearCart();
        window.dispatchEvent(new Event("onebitebakery_cart_updated"));
      }
      return response.data.data.order;
    }

    throw new Error("Order creation failed on server.");
  },

};
