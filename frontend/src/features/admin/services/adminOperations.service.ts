import { apiClient } from "@/services/api.client";

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export interface PlatformHealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}

export const adminOperationsService = {
  getAllOrders: async (params: { orderStatus?: string; search?: string } = {}) => {
    const response = await apiClient.get<{
      success: boolean;
      data: { orders: AdminOrderSummary[] };
    }>("/orders", { params });
    return response.data.data.orders;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { order: any };
    }>(`/orders/${orderId}/status`, { status });
    return response.data.data.order;
  },

  getPlatformHealth: async (): Promise<PlatformHealthResponse> => {
    const response = await apiClient.get<PlatformHealthResponse>("/health");
    return response.data;
  },

  getSystemMetrics: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: { metrics: any };
    }>("/platform/metrics");
    return response.data.data.metrics;
  },

  getAuditLogs: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: { auditLogs: any[] };
    }>("/platform/audit-logs");
    return response.data.data.auditLogs;
  },
};
