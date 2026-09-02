import { apiClient } from "./api.client";
import { MOCK_PRODUCTS } from "@/data/mockData";

export interface CartItem {
  id: string;
  productId: {
    id: string;
    name: string;
    slug: string;
    price: number;
    mainImage?: string;
    isAvailable: boolean;
    isEggless?: boolean;
  };
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  customization?: {
    eggless?: boolean;
    message?: string;
  };
}

export interface CartResponse {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  couponCode?: string;
  couponDiscount?: number;
  discountAmount?: number;
}

const LOCAL_STORAGE_KEY = "theonlinebakery_local_cart";

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";

const normalizeCartResponse = (cart: any): CartResponse => {
  if (!cart || !Array.isArray(cart.items)) {
    return {
      id: cart?.id || cart?._id || "local-cart-1",
      items: [],
      subtotal: 0,
      itemCount: 0,
      couponCode: cart?.couponCode,
      couponDiscount: cart?.couponDiscount || cart?.estimatedDiscount || 0,
      discountAmount: cart?.couponDiscount || cart?.estimatedDiscount || 0,
    };
  }

  const normalizedItems: CartItem[] = cart.items.map((item: any) => {
    let pId = "";
    let pName = "";
    let pSlug = "";
    let pPrice = 0;
    let pImage = "";

    if (typeof item.productId === "object" && item.productId !== null) {
      pId = String(item.productId.id || item.productId._id || "");
      pName = item.productId.name || "";
      pSlug = item.productId.slug || "";
      pPrice = item.productId.price || 0;
      pImage =
        item.productId.mainImage ||
        item.productId.thumbnailUrl ||
        item.productId.image ||
        "";
    } else if (typeof item.productId === "string") {
      pId = item.productId;
    }

    if (item.productSnapshot) {
      if (!pName && item.productSnapshot.name) pName = item.productSnapshot.name;
      if (!pSlug && item.productSnapshot.slug) pSlug = item.productSnapshot.slug;
      if (!pImage && (item.productSnapshot.thumbnailUrl || item.productSnapshot.image)) {
        pImage = item.productSnapshot.thumbnailUrl || item.productSnapshot.image;
      }
    }

    if (item.productDetails) {
      if (!pName && item.productDetails.name) pName = item.productDetails.name;
      if (!pSlug && item.productDetails.slug) pSlug = item.productDetails.slug;
      if (!pPrice && item.productDetails.price) pPrice = item.productDetails.price;
      if (!pImage && item.productDetails.mainImage) pImage = item.productDetails.mainImage;
    }

    const unitPrice =
      item.unitPriceSnapshot ||
      item.unitPrice ||
      pPrice ||
      (item.itemTotal || item.totalPrice
        ? Math.round((item.itemTotal || item.totalPrice) / (item.quantity || 1))
        : 0);

    if (!pName || pName === "Artisanal Bakery Item") {
      const mockMatch = MOCK_PRODUCTS.find(
        (p) => p.id === pId || p.slug === pSlug || pId.includes(p.id),
      );
      if (mockMatch) {
        pName = mockMatch.name;
        if (!pSlug) pSlug = mockMatch.slug;
        if (!pImage) pImage = mockMatch.image;
        if (!pPrice) pPrice = mockMatch.price;
      }
    }

    if (!pName) {
      pName = pId.startsWith("custom")
        ? "Custom Tier Celebration Cake"
        : "Belgian Chocolate Special Cake";
    }

    if (!pImage) {
      pImage = DEFAULT_FALLBACK_IMAGE;
    }

    const quantity = item.quantity || 1;
    const finalPrice = unitPrice || pPrice || 450;
    const itemTotal =
      item.itemTotal || item.totalPrice || finalPrice * quantity;

    return {
      id: String(item.id || item._id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
      productId: {
        id: pId || `prod-${Date.now()}`,
        name: pName,
        slug: pSlug || pId || "bakery-product",
        price: finalPrice,
        mainImage: pImage,
        isAvailable: true,
        isEggless: item.customization?.eggless ?? true,
      },
      quantity,
      unitPrice: finalPrice,
      itemTotal,
      customization: item.customization || item.customCakeConfig,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.itemTotal, 0);
  const itemCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const discountVal = cart.couponDiscount ?? cart.estimatedDiscount ?? 0;

  return {
    id: String(cart.id || cart._id || "cart-1"),
    userId: cart.userId ? String(cart.userId) : undefined,
    items: normalizedItems,
    subtotal: cart.subtotal || subtotal,
    itemCount: cart.itemCount || itemCount,
    couponCode: cart.couponCode,
    couponDiscount: discountVal,
    discountAmount: discountVal,
  };
};

const getLocalCart = (): CartResponse => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeCartResponse(parsed);
    }
  } catch (_err) {
    // Ignore
  }
  return {
    id: "local-cart-1",
    items: [],
    subtotal: 0,
    itemCount: 0,
  };
};

const saveLocalCart = (cart: CartResponse, dispatchEvent = true): CartResponse => {
  const normalized = normalizeCartResponse(cart);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
  } catch (_err) {
    // Ignore
  }
  if (dispatchEvent && typeof window !== "undefined") {
    window.dispatchEvent(new Event("theonlinebakery_cart_updated"));
  }
  return normalized;
};

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { cart: CartResponse };
      }>("/cart");
      if (response.data?.data?.cart) {
        const normalized = normalizeCartResponse(response.data.data.cart);
        saveLocalCart(normalized, false);
        return normalized;
      }
    } catch (_err) {
      // Fallback to local cart
    }
    return getLocalCart();
  },

  addItem: async (payload: {
    productId: string;
    quantity: number;
    customization?: { eggless?: boolean; message?: string };
    productDetails?: { name?: string; price?: number; mainImage?: string; slug?: string };
  }): Promise<CartResponse> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { cart: CartResponse };
      }>("/cart/items", {
        productId: payload.productId,
        quantity: payload.quantity,
        customization: payload.customization,
      });
      if (response.data?.data?.cart) {
        const normalized = normalizeCartResponse(response.data.data.cart);
        saveLocalCart(normalized);
        return normalized;
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const errorMsg = (err?.response?.data?.message || err?.message || "").toLowerCase();
      // If product is out of stock or unavailable, rethrow so UI displays "Out of Stock"
      if (status === 422 || errorMsg.includes("unavailable") || errorMsg.includes("stock") || errorMsg.includes("out of")) {
        throw new Error(err?.response?.data?.message || "Product is currently out of stock.");
      }
      // Otherwise fallback to local storage
    }

    const currentCart = getLocalCart();
    const mockMatch = MOCK_PRODUCTS.find((p) => p.id === payload.productId);

    const productDetails = {
      id: payload.productId,
      name:
        payload.productDetails?.name ||
        mockMatch?.name ||
        (payload.productId.startsWith("custom")
          ? "Custom Tier Celebration Cake"
          : "Fresh Handcrafted Bakery Cake"),
      slug: payload.productDetails?.slug || mockMatch?.slug || payload.productId,
      price: payload.productDetails?.price || mockMatch?.price || 649,
      mainImage:
        payload.productDetails?.mainImage ||
        mockMatch?.image ||
        DEFAULT_FALLBACK_IMAGE,
      isAvailable: true,
      isEggless: payload.customization?.eggless ?? mockMatch?.isEggless ?? true,
    };

    const existingIdx = currentCart.items.findIndex(
      (i) => i.productId.id === payload.productId,
    );

    if (existingIdx >= 0) {
      const existing = currentCart.items[existingIdx];
      const newQty = existing.quantity + payload.quantity;
      currentCart.items[existingIdx] = {
        ...existing,
        quantity: newQty,
        itemTotal: newQty * existing.unitPrice,
      };
    } else {
      const newItem: CartItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: productDetails,
        quantity: payload.quantity,
        unitPrice: productDetails.price,
        itemTotal: productDetails.price * payload.quantity,
        customization: payload.customization,
      };
      currentCart.items.push(newItem);
    }

    return saveLocalCart(currentCart);
  },

  updateQuantity: async (itemId: string, quantity: number): Promise<CartResponse> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { cart: CartResponse };
      }>(`/cart/items/${itemId}`, { quantity });
      if (response.data?.data?.cart) {
        const normalized = normalizeCartResponse(response.data.data.cart);
        saveLocalCart(normalized);
        return normalized;
      }
    } catch (_err) {
      // Fallback
    }

    const currentCart = getLocalCart();
    const itemIdx = currentCart.items.findIndex((i) => i.id === itemId);
    if (itemIdx >= 0) {
      if (quantity <= 0) {
        currentCart.items.splice(itemIdx, 1);
      } else {
        const item = currentCart.items[itemIdx];
        currentCart.items[itemIdx] = {
          ...item,
          quantity,
          itemTotal: quantity * item.unitPrice,
        };
      }
    }
    return saveLocalCart(currentCart);
  },

  removeItem: async (itemId: string): Promise<CartResponse> => {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        data: { cart: CartResponse };
      }>(`/cart/items/${itemId}`);
      if (response.data?.data?.cart) {
        const normalized = normalizeCartResponse(response.data.data.cart);
        saveLocalCart(normalized);
        return normalized;
      }
    } catch (_err) {
      // Fallback
    }

    const currentCart = getLocalCart();
    currentCart.items = currentCart.items.filter((i) => i.id !== itemId);
    return saveLocalCart(currentCart);
  },

  clearCart: async (): Promise<void> => {
    try {
      await apiClient.delete<{ success: boolean }>("/cart");
    } catch (_err) {
      // Ignore
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("theonlinebakery_cart_updated"));
    }
  },

  applyCoupon: async (code: string, currentSubtotal?: number): Promise<CartResponse> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      throw new Error("Please enter a valid promo code.");
    }

    const currentCart = getLocalCart();
    const computedSubtotal = currentCart.items.reduce(
      (sum, item) =>
        sum +
        (item.itemTotal ||
          (item.unitPrice || item.productId?.price || 0) * (item.quantity || 1)),
      0,
    );
    const effectiveSubtotal =
      typeof currentSubtotal === "number" && currentSubtotal > 0
        ? currentSubtotal
        : currentCart.subtotal > 0
          ? currentCart.subtotal
          : computedSubtotal;

    if (effectiveSubtotal <= 0 && (!currentCart.items || currentCart.items.length === 0)) {
      throw new Error("Your cart is empty. Please add items to your cart before applying a promo code.");
    }

    // First validate coupon rules with backend API
    try {
      const validateRes = await apiClient.post<{
        success: boolean;
        data: {
          code: string;
          discountType: "PERCENTAGE" | "FLAT";
          discountValue: number;
          discountAmount: number;
          description?: string;
        };
      }>("/coupons/validate", {
        code: cleanCode,
        subtotal: effectiveSubtotal,
      });

      if (validateRes.data?.data) {
        const result = validateRes.data.data;
        currentCart.couponCode = result.code;
        currentCart.couponDiscount = result.discountAmount;
        currentCart.discountAmount = result.discountAmount;
        if (effectiveSubtotal > 0 && currentCart.subtotal === 0) {
          currentCart.subtotal = effectiveSubtotal;
        }

        // Also attempt sync with backend cart if active
        try {
          await apiClient.post("/cart/coupon", { code: cleanCode });
        } catch (_cartErr) {
          // Backend cart sync optional if local cart is primary
        }

        return saveLocalCart(currentCart);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        `Invalid promo code "${cleanCode}".`;
      throw new Error(msg);
    }

    // Local fallback calculation if API was unreachable
    let discount = 100;
    if (cleanCode.includes("20") || cleanCode === "SWEET20") {
      discount = Math.min(150, Math.round(effectiveSubtotal * 0.2));
    } else if (cleanCode === "FESTIVE50") {
      discount = 50;
    }

    if (cleanCode === "WELCOME100" && effectiveSubtotal < 499) {
      throw new Error("Minimum order subtotal of ₹499 required for coupon WELCOME100.");
    }

    currentCart.couponCode = cleanCode;
    currentCart.couponDiscount = discount;
    currentCart.discountAmount = discount;
    if (effectiveSubtotal > 0 && currentCart.subtotal === 0) {
      currentCart.subtotal = effectiveSubtotal;
    }
    return saveLocalCart(currentCart);
  },

  removeCoupon: async (): Promise<CartResponse> => {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        data: { cart: CartResponse };
      }>("/cart/coupon");
      if (response.data?.data?.cart) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("theonlinebakery_cart_updated"));
        }
        return normalizeCartResponse(response.data.data.cart);
      }
    } catch (_err) {
      // Fallback
    }

    const currentCart = getLocalCart();
    currentCart.couponCode = undefined;
    currentCart.couponDiscount = 0;
    currentCart.discountAmount = 0;
    return saveLocalCart(currentCart);
  },
};
