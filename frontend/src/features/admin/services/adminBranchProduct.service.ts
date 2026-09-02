import { apiClient } from "@/services/api.client";

export interface BranchProductDetails {
  branchId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productType: string;
  globalPrice: number;
  globalIsAvailable: boolean;
  thumbnailUrl: string;
  isAvailable: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  isOverride: boolean;
  updatedAt?: string;
}

export interface BranchDashboardStats {
  branch: {
    id: string;
    name: string;
    code: string;
    type: "MAIN" | "FRANCHISE";
  };
  stats: {
    todayOrders: number;
    totalOrders?: number;
    pendingOrders: number;
    preparingOrders: number;
    outForDelivery: number;
    deliveredOrders: number;
    cancelledOrders?: number;
    lowStockProducts: number;
    unavailableProducts: number;
  };
}

export interface UpdateBranchProductPayload {
  isAvailable?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
}

export interface BranchProductMatrixData {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    globalIsAvailable: boolean;
    thumbnailUrl: string;
    productType: string;
  }>;
  branches: Array<{
    id: string;
    name: string;
    code: string;
    type: "MAIN" | "FRANCHISE";
  }>;
  matrix: Record<
    string,
    Record<
      string,
      {
        isAvailable: boolean;
        stockQuantity: number;
        lowStockThreshold: number;
        allowBackorder: boolean;
        isOverride: boolean;
      }
    >
  >;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string;
}

export const adminBranchProductService = {
  getBranchProducts: async (branchId: string): Promise<BranchProductDetails[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { products: BranchProductDetails[] };
    }>(`/branches/${branchId}/products`);
    return response.data.data.products;
  },

  getBranchProductMatrix: async (): Promise<BranchProductMatrixData> => {
    const response = await apiClient.get<{
      success: boolean;
      data: BranchProductMatrixData;
    }>("/branches/matrix");
    return response.data.data;
  },

  updateBranchProduct: async (
    branchId: string,
    productId: string,
    payload: UpdateBranchProductPayload,
  ): Promise<BranchProductDetails> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { product: BranchProductDetails };
    }>(`/branches/${branchId}/products/${productId}`, payload);
    return response.data.data.product;
  },

  getBranchDashboardStats: async (branchId: string): Promise<BranchDashboardStats> => {
    const response = await apiClient.get<{
      success: boolean;
      data: BranchDashboardStats;
    }>(`/branches/${branchId}/dashboard`);
    return response.data.data;
  },

  getBranchDeliveryAgents: async (branchId: string): Promise<DeliveryAgent[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { agents: DeliveryAgent[] };
    }>(`/branches/${branchId}/delivery-agents`);
    return response.data.data.agents;
  },

  assignDeliveryAgent: async (branchId: string, orderId: string, deliveryAgentId: string) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { order: unknown };
    }>(`/branches/${branchId}/orders/${orderId}/assign-delivery`, { deliveryAgentId });
    return response.data.data;
  },

  unassignDeliveryAgent: async (branchId: string, orderId: string) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { order: unknown };
    }>(`/branches/${branchId}/orders/${orderId}/unassign-delivery`);
    return response.data.data;
  },
};
