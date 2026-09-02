import { apiClient } from "@/services/api.client";

export interface DeliveryAgentDashboardStats {
  todayAssigned: number;
  todayOutForDelivery: number;
  todayDelivered: number;
  todayCancelled: number;
  pendingDelivery: number;
}

export interface DeliveryOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  orderStatus: "PENDING" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  deliveryMethod: "HOME_DELIVERY" | "STORE_PICKUP";
  pricingSnapshot?: {
    grandTotal: number;
  };
  totalAmount?: number;
  items: DeliveryOrderItem[];
  branchSnapshot?: {
    name: string;
    code: string;
  };
  locationSnapshot?: {
    villageName: string;
    district: string;
    pincode: string;
  };
  addressSnapshot?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  deliveryAgentSnapshot?: {
    agentId: string;
    name: string;
    phone?: string;
  };
  deliveryStartedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export const deliveryAgentService = {
  getDashboardStats: async (): Promise<DeliveryAgentDashboardStats> => {
    const response = await apiClient.get<{
      success: boolean;
      data: DeliveryAgentDashboardStats;
    }>("/delivery-agent/dashboard");
    return response.data.data;
  },

  getOrders: async (status?: string): Promise<DeliveryOrder[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { orders: DeliveryOrder[] };
    }>("/delivery-agent/orders", {
      params: { status },
    });
    return response.data.data.orders;
  },

  getOrderById: async (orderId: string): Promise<DeliveryOrder> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { order: DeliveryOrder };
    }>(`/delivery-agent/orders/${orderId}`);
    return response.data.data.order;
  },

  startDelivery: async (orderId: string): Promise<DeliveryOrder> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { order: DeliveryOrder };
    }>(`/delivery-agent/orders/${orderId}/start`);
    return response.data.data.order;
  },

  completeDelivery: async (orderId: string): Promise<DeliveryOrder> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { order: DeliveryOrder };
    }>(`/delivery-agent/orders/${orderId}/complete`);
    return response.data.data.order;
  },
};
