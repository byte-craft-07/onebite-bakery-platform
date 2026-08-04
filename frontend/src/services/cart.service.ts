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
}

const LOCAL_STORAGE_KEY = "onebite_local_cart";

const getLocalCart = (): CartResponse => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        const itemCount = parsed.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        const subtotal = parsed.items.reduce((sum: number, item: any) => sum + (item.itemTotal || 0), 0);
        return { ...parsed, itemCount, subtotal };
      }
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

const saveLocalCart = (cart: CartResponse): CartResponse => {
  const subtotal = cart.items.reduce((sum, item) => sum + item.itemTotal, 0);
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const updatedCart: CartResponse = {
    ...cart,
    subtotal,
    itemCount,
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCart));
  } catch (_err) {
    // Ignore
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("onebite_cart_updated"));
  }
  return updatedCart;
};

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { cart: CartResponse };
      }>("/cart");
      if (response.data?.data?.cart) {
        return response.data.data.cart;
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
  }): Promise<CartResponse> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { cart: CartResponse };
      }>("/cart/items", payload);
      if (response.data?.data?.cart) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("onebite_cart_updated"));
        }
        return response.data.data.cart;
      }
    } catch (_err) {
      // Fallback
    }

    const currentCart = getLocalCart();
    const mockMatch = MOCK_PRODUCTS.find((p) => p.id === payload.productId);

    const productDetails = mockMatch
      ? {
          id: mockMatch.id,
          name: mockMatch.name,
          slug: mockMatch.slug,
          price: mockMatch.price,
          mainImage: mockMatch.image,
          isAvailable: true,
          isEggless: mockMatch.isEggless,
        }
      : {
          id: payload.productId,
          name: payload.productId.startsWith("custom") ? "Custom Tier Celebration Cake" : "Artisanal Bakery Item",
          slug: payload.productId,
          price: 850,
          mainImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
          isAvailable: true,
          isEggless: payload.customization?.eggless ?? true,
        };

    const existingIdx = currentCart.items.findIndex((i) => i.productId.id === payload.productId);

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
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("onebite_cart_updated"));
        }
        return response.data.data.cart;
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
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("onebite_cart_updated"));
        }
        return response.data.data.cart;
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
      window.dispatchEvent(new Event("onebite_cart_updated"));
    }
  },
};
