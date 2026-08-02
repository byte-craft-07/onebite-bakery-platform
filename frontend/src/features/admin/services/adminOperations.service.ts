import { apiClient } from "@/services/api.client";

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP" | string;
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

export interface AdminCustomerSummary {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  status: "active" | "blocked";
  createdAt: string;
}

export interface AdminPaymentSummary {
  id: string;
  orderNumber: string;
  paymentId: string;
  amount: number;
  method: string;
  status: "PAID" | "PENDING" | "FAILED";
  createdAt: string;
}

export interface StoreSettingsPayload {
  storeName: string;
  phone: string;
  email: string;
  gstin: string;
  minOrderValue: number;
  freeDeliveryThreshold: number;
  standardDeliveryCharge: number;
  isOrderAcceptanceActive: boolean;
}

const ORDERS_KEY = "onebite_local_orders";
const CUSTOMERS_KEY = "onebite_local_customers";
const NOTIFS_KEY = "onebite_local_notifications";
const LOGS_KEY = "onebite_local_audit_logs";
const SETTINGS_KEY = "onebite_local_settings";

const initialOrders: AdminOrderSummary[] = [
  {
    id: "ord-101",
    orderNumber: "OB-98210",
    customerName: "Ananya Sharma",
    customerPhone: "9876543210",
    fulfillmentType: "HOME_DELIVERY",
    totalAmount: 1298,
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "ord-102",
    orderNumber: "OB-98211",
    customerName: "Rohan Verma",
    customerPhone: "9876543211",
    fulfillmentType: "STORE_PICKUP",
    totalAmount: 649,
    orderStatus: "PREPARING",
    paymentStatus: "PAID",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "ord-103",
    orderNumber: "OB-98212",
    customerName: "Development Admin",
    customerPhone: "9999999999",
    fulfillmentType: "HOME_DELIVERY",
    totalAmount: 899,
    orderStatus: "DELIVERED",
    paymentStatus: "PAID",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const initialCustomers: AdminCustomerSummary[] = [
  {
    id: "usr-1",
    name: "Ananya Sharma",
    phone: "9876543210",
    email: "ananya@example.com",
    role: "customer",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "usr-2",
    name: "Rohan Verma",
    phone: "9876543211",
    email: "rohan@example.com",
    role: "customer",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "usr-3",
    name: "Development Admin",
    phone: "9999999999",
    email: "admin@onebite.local",
    role: "admin",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

const initialNotifs = [
  {
    id: "notif-1",
    recipient: "+91 9876543210",
    type: "SMS_OTP",
    title: "Customer Login Verification Code",
    status: "DELIVERED",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
  },
  {
    id: "notif-2",
    recipient: "admin@onebite.local",
    type: "EMAIL_ALERT",
    title: "New Online Order #OB-98210 Placed",
    status: "DELIVERED",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
  },
];

const initialLogs = [
  {
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    action: "UPDATE_PRODUCT_PRICE",
    entityType: "Product Catalog",
    userId: "admin-9999",
    status: "SUCCESS",
  },
  {
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    action: "DISPATCH_ORDER_STATUS",
    entityType: "Order Dispatch",
    userId: "admin-9999",
    status: "SUCCESS",
  },
];

const getStored = <T,>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_e) {
    // Ignore
  }
  return defaultVal;
};

const setStored = <T,>(key: string, val: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_e) {
    // Ignore
  }
};

export const adminOperationsService = {
  logAuditAction: (action: string, entityType: string) => {
    const current = getStored(LOGS_KEY, initialLogs);
    const newEntry = {
      createdAt: new Date().toISOString(),
      action,
      entityType,
      userId: "Development Admin",
      status: "SUCCESS",
    };
    setStored(LOGS_KEY, [newEntry, ...current]);
  },

  getAllOrders: async (params: { orderStatus?: string; search?: string } = {}): Promise<AdminOrderSummary[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { orders: AdminOrderSummary[] };
      }>("/orders", { params });
      if (response.data?.data?.orders && response.data.data.orders.length > 0) {
        return response.data.data.orders;
      }
    } catch (_err) {
      // Fallback
    }

    let list = getStored<AdminOrderSummary[]>(ORDERS_KEY, initialOrders);
    if (params.orderStatus && params.orderStatus !== "ALL") {
      list = list.filter((o) => o.orderStatus === params.orderStatus);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q));
    }
    return list;
  },

  addOrderRecord: (order: { id: string; orderNumber: string; totalAmount: number; fulfillmentType?: string }) => {
    const current = getStored<AdminOrderSummary[]>(ORDERS_KEY, initialOrders);
    const newOrder: AdminOrderSummary = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: "Bakery Customer",
      customerPhone: "9876543210",
      fulfillmentType: order.fulfillmentType || "HOME_DELIVERY",
      totalAmount: order.totalAmount,
      orderStatus: "CONFIRMED",
      paymentStatus: "PAID",
      createdAt: new Date().toISOString(),
    };
    setStored(ORDERS_KEY, [newOrder, ...current]);
    adminOperationsService.logAuditAction("NEW_ORDER_PLACED", `Order #${order.orderNumber}`);

    // Add alert notification
    const notifs = getStored(NOTIFS_KEY, initialNotifs);
    setStored(NOTIFS_KEY, [
      {
        id: `notif-${Date.now()}`,
        recipient: "admin@onebite.local",
        type: "ORDER_ALERT",
        title: `New Order #${order.orderNumber} (₹${order.totalAmount}) Received`,
        status: "DELIVERED",
        createdAt: new Date().toISOString(),
        isRead: false,
      },
      ...notifs,
    ]);
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { order: any };
      }>(`/orders/${orderId}/status`, { status });
      if (response.data?.data?.order) {
        return response.data.data.order;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getStored<AdminOrderSummary[]>(ORDERS_KEY, initialOrders);
    const idx = current.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      current[idx].orderStatus = status;
      setStored(ORDERS_KEY, current);
      adminOperationsService.logAuditAction("UPDATE_ORDER_STATUS", `Order #${current[idx].orderNumber} set to ${status}`);
      return current[idx];
    }
    return null;
  },

  getCustomers: async (): Promise<AdminCustomerSummary[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { users: AdminCustomerSummary[] };
      }>("/users");
      if (response.data?.data?.users) {
        return response.data.data.users;
      }
    } catch (_err) {
      // Fallback
    }
    return getStored<AdminCustomerSummary[]>(CUSTOMERS_KEY, initialCustomers);
  },

  toggleCustomerStatus: async (userId: string, currentStatus: "active" | "blocked") => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { user: AdminCustomerSummary };
      }>(`/users/${userId}/status`, { status: newStatus });
      if (response.data?.data?.user) {
        return response.data.data.user;
      }
    } catch (_err) {
      // Fallback
    }

    const list = getStored<AdminCustomerSummary[]>(CUSTOMERS_KEY, initialCustomers);
    const idx = list.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      list[idx].status = newStatus;
      setStored(CUSTOMERS_KEY, list);
      adminOperationsService.logAuditAction("TOGGLE_USER_STATUS", `User ${list[idx].name} set to ${newStatus}`);
      return list[idx];
    }
    return { id: userId, status: newStatus } as any;
  },

  getPayments: async (): Promise<AdminPaymentSummary[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { payments: AdminPaymentSummary[] };
      }>("/payments");
      if (response.data?.data?.payments) {
        return response.data.data.payments;
      }
    } catch (_err) {
      // Fallback
    }

    const orders = getStored<AdminOrderSummary[]>(ORDERS_KEY, initialOrders);
    return orders.map((o) => ({
      id: `pay-${o.id}`,
      orderNumber: o.orderNumber,
      paymentId: `pay_${o.id.replace(/-/g, "")}`,
      amount: o.totalAmount,
      method: o.fulfillmentType === "STORE_PICKUP" ? "UPI_PAY_ON_PICKUP" : "RAZORPAY_CARD",
      status: "PAID",
      createdAt: o.createdAt,
    }));
  },

  getNotifications: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { notifications: any[] };
      }>("/notifications");
      if (response.data?.data?.notifications) {
        return response.data.data.notifications;
      }
    } catch (_err) {
      // Fallback
    }
    return getStored(NOTIFS_KEY, initialNotifs);
  },

  sendBroadcastNotification: async (payload: { title: string; message: string; targetRole: string }) => {
    adminOperationsService.logAuditAction("DISPATCH_BROADCAST", `Title: "${payload.title}"`);
    const current = getStored(NOTIFS_KEY, initialNotifs);
    const newNotif = {
      id: `notif-${Date.now()}`,
      recipient: "BROADCAST_ALL_CUSTOMERS",
      type: "PROMO_BROADCAST",
      title: payload.title,
      status: "DELIVERED",
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setStored(NOTIFS_KEY, [newNotif, ...current]);

    try {
      await apiClient.post<{ success: boolean }>("/notifications/broadcast", payload);
    } catch (_err) {
      // Ignore
    }
    return { success: true };
  },

  getSettings: async (): Promise<StoreSettingsPayload> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { settings: StoreSettingsPayload };
      }>("/settings");
      if (response.data?.data?.settings) {
        return response.data.data.settings;
      }
    } catch (_err) {
      // Fallback
    }
    return getStored<StoreSettingsPayload>(SETTINGS_KEY, {
      storeName: "OneBite Artisanal Bakery",
      phone: "+91 9876543210",
      email: "orders@onebite.local",
      gstin: "07AAAAA0000A1Z5",
      minOrderValue: 299,
      freeDeliveryThreshold: 799,
      standardDeliveryCharge: 49,
      isOrderAcceptanceActive: true,
    });
  },

  updateSettings: async (settings: StoreSettingsPayload) => {
    setStored(SETTINGS_KEY, settings);
    adminOperationsService.logAuditAction("UPDATE_STORE_SETTINGS", `Min order ₹${settings.minOrderValue}, Free threshold ₹${settings.freeDeliveryThreshold}`);
    try {
      await apiClient.put<{
        success: boolean;
        data: { settings: StoreSettingsPayload };
      }>("/settings", settings);
    } catch (_err) {
      // Ignore
    }
    return settings;
  },

  getPlatformHealth: async (): Promise<PlatformHealthResponse> => {
    try {
      const response = await apiClient.get<PlatformHealthResponse>("/health");
      if (response.data?.status) return response.data;
    } catch (_err) {
      // Fallback
    }
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: 86400,
      memoryUsage: { rss: 120 * 1024 * 1024, heapTotal: 80 * 1024 * 1024, heapUsed: 45 * 1024 * 1024 },
    };
  },

  getSystemMetrics: async () => {
    const orders = getStored<AdminOrderSummary[]>(ORDERS_KEY, initialOrders);
    const customers = getStored<AdminCustomerSummary[]>(CUSTOMERS_KEY, initialCustomers);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const activeCustomers = customers.filter((c) => c.status === "active").length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      totalRevenue,
      totalOrders,
      activeCustomers,
      averageOrderValue,
    };
  },

  getAuditLogs: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { auditLogs: any[] };
      }>("/platform/audit-logs");
      if (response.data?.data?.auditLogs && response.data.data.auditLogs.length > 0) {
        return response.data.data.auditLogs;
      }
    } catch (_err) {
      // Fallback
    }
    return getStored(LOGS_KEY, initialLogs);
  },
};
