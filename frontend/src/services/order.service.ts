import { apiClient } from "./api.client";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  itemTotal: number;
}

export interface OrderDetails {
  id: string;
  orderNumber: string;
  orderStatus: "PENDING" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export const orderService = {
  getCustomerOrders: async (): Promise<OrderDetails[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { orders: OrderDetails[] };
    }>("/orders");
    return response.data.data.orders;
  },

  getOrderById: async (id: string): Promise<OrderDetails> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { order: OrderDetails };
    }>(`/orders/${id}`);
    return response.data.data.order;
  },

  cancelOrder: async (id: string, reason?: string) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { order: OrderDetails };
    }>(`/orders/${id}/cancel`, { reason });
    return response.data.data.order;
  },
};
