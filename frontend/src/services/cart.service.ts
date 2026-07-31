import { apiClient } from "./api.client";

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

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { cart: CartResponse };
    }>("/cart");
    return response.data.data.cart;
  },

  addItem: async (payload: { productId: string; quantity: number; customization?: { eggless?: boolean; message?: string } }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { cart: CartResponse };
    }>("/cart/items", payload);
    return response.data.data.cart;
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { cart: CartResponse };
    }>(`/cart/items/${itemId}`, { quantity });
    return response.data.data.cart;
  },

  removeItem: async (itemId: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      data: { cart: CartResponse };
    }>(`/cart/items/${itemId}`);
    return response.data.data.cart;
  },

  clearCart: async () => {
    const response = await apiClient.delete<{ success: boolean }>("/cart");
    return response.data;
  },
};
