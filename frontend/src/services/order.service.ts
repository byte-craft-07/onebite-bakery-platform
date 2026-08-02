import { apiClient } from "./api.client";
import { adminOperationsService } from "@/features/admin/services/adminOperations.service";

export interface OrderItemDetails {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  itemTotal: number;
  isEggless?: boolean;
}

export interface OrderDetails {
  id: string;
  orderNumber: string;
  orderStatus:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "BAKING"
    | "QUALITY_CHECK"
    | "PACKED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  items: OrderItemDetails[];
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

const LOCAL_ORDERS_KEY = "onebite_customer_orders_list";

const mockOrders: OrderDetails[] = [
  {
    id: "ord-101",
    orderNumber: "OB-98210",
    orderStatus: "PREPARING",
    paymentStatus: "PAID",
    fulfillmentType: "HOME_DELIVERY",
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        name: "Belgian Dark Chocolate Truffle Cake (1 Kg)",
        unitPrice: 649,
        quantity: 1,
        itemTotal: 649,
        isEggless: true,
      },
      {
        id: "item-2",
        productId: "prod-2",
        name: "Red Velvet Cream Cheese Pastry",
        unitPrice: 169,
        quantity: 2,
        itemTotal: 338,
        isEggless: true,
      },
    ],
    subtotal: 987,
    deliveryFee: 49,
    taxAmount: 49,
    discountAmount: 0,
    totalAmount: 1085,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    deliveryAddress: {
      street: "Flat 402, Sunshine Apartments, Civil Lines",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110054",
    },
  },
  {
    id: "ord-100",
    orderNumber: "OB-98195",
    orderStatus: "DELIVERED",
    paymentStatus: "PAID",
    fulfillmentType: "HOME_DELIVERY",
    items: [
      {
        id: "item-3",
        productId: "prod-3",
        name: "Fresh Sourdough Whole Wheat Bread",
        unitPrice: 140,
        quantity: 5,
        itemTotal: 700,
        isEggless: true,
      },
    ],
    subtotal: 700,
    deliveryFee: 0,
    taxAmount: 35,
    discountAmount: 0,
    totalAmount: 735,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const orderService = {
  addOrder: (order: OrderDetails) => {
    try {
      const existing = orderService.getLocalOrders();
      const updated = [order, ...existing];
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
      adminOperationsService.addOrderRecord({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        fulfillmentType: order.fulfillmentType,
      });
    } catch (_e) {
      // Ignore
    }
  },

  getLocalOrders: (): OrderDetails[] => {
    try {
      const stored = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_e) {
      // Ignore
    }
    return mockOrders;
  },

  getCustomerOrders: async (): Promise<OrderDetails[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { orders: OrderDetails[] };
      }>("/orders");
      if (response.data?.data?.orders && response.data.data.orders.length > 0) {
        return response.data.data.orders;
      }
    } catch (_err) {
      // Fallback to local customer orders
    }
    return orderService.getLocalOrders();
  },

  getOrderById: async (id: string): Promise<OrderDetails> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { order: OrderDetails };
      }>(`/orders/${id}`);
      if (response.data?.data?.order) {
        return response.data.data.order;
      }
    } catch (_err) {
      // Fallback
    }

    const localList = orderService.getLocalOrders();
    const found = localList.find((o) => o.id === id || o.orderNumber === id);
    if (found) return found;

    return localList[0] || mockOrders[0];
  },

  cancelOrder: async (id: string, reason?: string) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { order: OrderDetails };
      }>(`/orders/${id}/cancel`, { reason });
      return response.data.data.order;
    } catch (_err) {
      const localList = orderService.getLocalOrders();
      const idx = localList.findIndex((o) => o.id === id);
      if (idx >= 0) {
        localList[idx].orderStatus = "CANCELLED";
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(localList));
        return localList[idx];
      }
      return { id, orderStatus: "CANCELLED" } as any;
    }
  },
};
