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
    | "READY"
    | "READY_FOR_PICKUP"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  paymentStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  paymentMethod?: "UPI" | "COD";
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  items: OrderItemDetails[];
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  deliveryTimingType?: "INSTANT" | "SCHEDULED";
  deliveryTimePreference?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  locationSnapshot?: {
    villageId?: string;
    villageName: string;
    district: string;
    pincode: string;
  };
  addressSnapshot?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface BackendOrderItem {
  _id?: string;
  id?: string;
  productId?: string;
  productName?: string;
  productNameSnapshot?: string;
  name?: string;
  unitPrice?: number;
  unitPriceSnapshot?: number;
  quantity: number;
  subtotal?: number;
  itemTotal?: number;
}

interface BackendOrder {
  id: string;
  orderNumber: string;
  orderStatus: OrderDetails["orderStatus"];
  paymentStatus: OrderDetails["paymentStatus"];
  paymentMethod?: "UPI" | "COD";
  deliveryMethod?: OrderDetails["fulfillmentType"];
  fulfillmentType?: OrderDetails["fulfillmentType"];
  items?: BackendOrderItem[];
  subtotal?: number;
  deliveryCharge?: number;
  deliveryFee?: number;
  totalAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  deliveryTimingType?: "INSTANT" | "SCHEDULED";
  deliveryTimePreference?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  customerName?: string;
  customerPhone?: string;
  pricingSnapshot?: {
    subtotal?: number;
    tax?: number;
    deliveryCharge?: number;
    discount?: number;
    grandTotal?: number;
  };
  createdAt?: string;
  locationSnapshot?: OrderDetails["locationSnapshot"];
  addressSnapshot?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  deliveryAddress?: OrderDetails["deliveryAddress"];
}

const LOCAL_ORDERS_KEY = "theonlinebakery_customer_orders_list";

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

const toDeliveryAddress = (
  address?: BackendOrder["deliveryAddress"] | BackendOrder["addressSnapshot"],
): OrderDetails["deliveryAddress"] => {
  if (!address?.street || !address.city || !address.state || !address.pincode) {
    return undefined;
  }

  return {
    street: address.street,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };
};

const toOrderDetails = (order: BackendOrder): OrderDetails => {
  const pricing = order.pricingSnapshot;
  const totalAmount = order.totalAmount ?? pricing?.grandTotal ?? 0;
  const subtotal = order.subtotal ?? pricing?.subtotal ?? totalAmount;
  const deliveryFee = order.deliveryFee ?? order.deliveryCharge ?? pricing?.deliveryCharge ?? 0;
  const taxAmount = order.taxAmount ?? pricing?.tax ?? 0;
  const discountAmount = order.discountAmount ?? pricing?.discount ?? 0;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod ?? "UPI",
    fulfillmentType: order.fulfillmentType ?? order.deliveryMethod ?? "HOME_DELIVERY",
    items: (order.items ?? []).map((item, index) => {
      const unitPrice = item.unitPrice ?? item.unitPriceSnapshot ?? 0;
      const itemTotal = item.itemTotal ?? item.subtotal ?? unitPrice * item.quantity;

      return {
        id: item.id ?? item._id ?? `${order.id}-${index}`,
        productId: item.productId ?? "",
        name: item.name ?? item.productName ?? item.productNameSnapshot ?? "The Online Bakery item",
        unitPrice,
        quantity: item.quantity,
        itemTotal,
      };
    }),
    subtotal,
    deliveryFee,
    taxAmount,
    discountAmount,
    totalAmount,
    deliveryTimingType: order.deliveryTimingType ?? (order.scheduledDate ? "SCHEDULED" : "INSTANT"),
    deliveryTimePreference: order.deliveryTimePreference ?? (order.scheduledDate ? `📅 Scheduled: ${order.scheduledDate} ${order.scheduledTimeSlot || ""}` : "⚡ Instant Delivery (Within 30-45 mins)"),
    scheduledDate: order.scheduledDate,
    scheduledTimeSlot: order.scheduledTimeSlot,
    customerName: order.customerName || order.addressSnapshot?.fullName,
    customerPhone: order.customerPhone || order.addressSnapshot?.phone,
    createdAt: order.createdAt ?? new Date().toISOString(),
    ...(order.locationSnapshot ? { locationSnapshot: order.locationSnapshot } : {}),
    ...(order.addressSnapshot ? { addressSnapshot: order.addressSnapshot } : {}),
    deliveryAddress: toDeliveryAddress(order.deliveryAddress ?? order.addressSnapshot),
  };
};

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
        customerName: order.customerName || order.addressSnapshot?.fullName,
        customerPhone: order.customerPhone || order.addressSnapshot?.phone,
        deliveryTimingType: order.deliveryTimingType,
        deliveryTimePreference: order.deliveryTimePreference,
        scheduledDate: order.scheduledDate,
        scheduledTimeSlot: order.scheduledTimeSlot,
        addressSnapshot: order.addressSnapshot,
        locationSnapshot: order.locationSnapshot,
        items: order.items,
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
    return [];
  },

  getCustomerOrders: async (): Promise<OrderDetails[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { orders: BackendOrder[] };
      }>("/orders");
      if (response.data?.data?.orders) {
        return response.data.data.orders.map(toOrderDetails);
      }
    } catch (_err) {
      return orderService.getLocalOrders();
    }
    return [];
  },

  getOrderById: async (id: string): Promise<OrderDetails> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { order: BackendOrder };
      }>(`/orders/${id}`);
      if (response.data?.data?.order) {
        return toOrderDetails(response.data.data.order);
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
        data: { order: BackendOrder };
      }>(`/orders/${id}/cancel`, { reason });
      return toOrderDetails(response.data.data.order);
    } catch (_err) {
      const localList = orderService.getLocalOrders();
      const idx = localList.findIndex((o) => o.id === id);
      if (idx >= 0) {
        localList[idx].orderStatus = "CANCELLED";
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(localList));
        return localList[idx];
      }
      throw new Error("Unable to cancel order.");
    }
  },
};
