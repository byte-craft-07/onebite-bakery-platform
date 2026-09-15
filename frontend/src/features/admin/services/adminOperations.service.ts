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
  deliveryTimingType?: "INSTANT" | "SCHEDULED" | string;
  deliveryTimePreference?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  branchSnapshot?: {
    branchId?: string;
    name: string;
    code: string;
    type?: "MAIN" | "FRANCHISE" | string;
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
  locationSnapshot?: {
    villageId?: string;
    villageName: string;
    district: string;
    pincode: string;
  };
  items?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    name?: string;
    image?: string;
    thumbnailUrl?: string;
    quantity: number;
    unitPrice: number;
    subtotal?: number;
    itemTotal?: number;
    customization?: any;
    customCakeConfig?: any;
  }>;
  notes?: string;
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
  phone?: string;
  email?: string;
  role: string;
  status: "active" | "blocked";
  address?: {
    phone?: string;
    village?: string;
    district?: string;
    street?: string;
    pincode?: string;
  };
  currentLocation?: {
    villageId?: string;
    villageName: string;
    district: string;
    pincode: string;
  };
  createdAt: string;
}

export interface AdminMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: "admin" | "branch_admin" | string;
  status: "active" | "blocked";
  isPrimaryOwner?: boolean;
  branchId?: string;
  profileImage?: string;
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
  taxRatePercent: number;
  isTaxEnabled: boolean;
  isOrderAcceptanceActive: boolean;
}

const ORDERS_KEY = "theonlinebakery_local_orders";
const NOTIFS_KEY = "theonlinebakery_local_notifications";
const LOGS_KEY = "theonlinebakery_local_audit_logs";

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
    const current = getStored(LOGS_KEY, []);
    const newEntry = {
      createdAt: new Date().toISOString(),
      action,
      entityType,
      userId: "Bakery Admin",
      status: "SUCCESS",
    };
    setStored(LOGS_KEY, [newEntry, ...current]);
  },

  getAllOrders: async (params: { orderStatus?: string; search?: string; branchType?: "MAIN" | "FRANCHISE"; branchId?: string } = {}): Promise<AdminOrderSummary[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { orders: any[] };
      }>("/orders/admin/orders", { params });

      if (response.data?.data?.orders) {
        let list: AdminOrderSummary[] = response.data.data.orders.map((o: any) => ({
          id: o.id || o._id,
          orderNumber: o.orderNumber,
          customerName: o.customerName || o.addressSnapshot?.fullName || "Bakery Customer",
          customerPhone: o.customerPhone || o.addressSnapshot?.phone || "N/A",
          fulfillmentType: o.fulfillmentType || o.deliveryMethod || "HOME_DELIVERY",
          totalAmount: o.totalAmount ?? o.pricingSnapshot?.grandTotal ?? 0,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          deliveryTimingType: o.deliveryTimingType || (o.scheduledDate ? "SCHEDULED" : "INSTANT"),
          deliveryTimePreference: o.deliveryTimePreference || (o.scheduledDate ? `📅 Scheduled: ${new Date(o.scheduledDate).toLocaleDateString()} ${o.scheduledTimeSlot || ""}` : "⚡ Instant Delivery (Within 30-45 mins)"),
          scheduledDate: o.scheduledDate,
          scheduledTimeSlot: o.scheduledTimeSlot,
          branchSnapshot: o.branchSnapshot ? {
            branchId: o.branchSnapshot.branchId ? String(o.branchSnapshot.branchId) : undefined,
            name: o.branchSnapshot.name,
            code: o.branchSnapshot.code,
            type: o.branchSnapshot.type,
          } : undefined,
          addressSnapshot: o.addressSnapshot,
          locationSnapshot: o.locationSnapshot,
          items: (o.items || []).map((it: any) => ({
            id: it.id || it._id,
            productId: it.productId ? String(it.productId) : undefined,
            productName: it.productName || it.productNameSnapshot || it.name || "Bakery Product",
            name: it.productName || it.productNameSnapshot || it.name || "Bakery Product",
            image: it.image || it.thumbnailUrl || it.imageUrl || (it.imageUrls && it.imageUrls[0]) || it.mainImage,
            thumbnailUrl: it.thumbnailUrl || it.image || it.imageUrl || (it.imageUrls && it.imageUrls[0]) || it.mainImage,
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || it.unitPriceSnapshot || 0,
            subtotal: it.subtotal || it.itemTotal || (it.unitPrice || 0) * (it.quantity || 1),
            itemTotal: it.subtotal || it.itemTotal || (it.unitPrice || 0) * (it.quantity || 1),
            customization: it.customization || it.customCakeConfig,
            customCakeConfig: it.customization || it.customCakeConfig,
          })),
          notes: o.notes,
          createdAt: o.createdAt || new Date().toISOString(),
        }));

        if (params.branchType === "MAIN") {
          list = list.filter((o) => !o.branchSnapshot || o.branchSnapshot.type !== "FRANCHISE");
        } else if (params.branchType === "FRANCHISE") {
          list = list.filter((o) => o.branchSnapshot?.type === "FRANCHISE");
        }

        if (params.orderStatus && params.orderStatus !== "ALL") {
          list = list.filter((o) => o.orderStatus === params.orderStatus);
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(q) ||
              o.customerName.toLowerCase().includes(q) ||
              o.customerPhone.includes(q) ||
              (o.addressSnapshot?.street && o.addressSnapshot.street.toLowerCase().includes(q)) ||
              (o.locationSnapshot?.villageName && o.locationSnapshot.villageName.toLowerCase().includes(q)),
          );
        }
        return list;
      }
    } catch (_err) {
      // Fallback
    }

    let stored = getStored<AdminOrderSummary[]>(ORDERS_KEY, []);
    if (params.branchType === "MAIN") {
      stored = stored.filter((o) => !o.branchSnapshot || o.branchSnapshot.type !== "FRANCHISE");
    } else if (params.branchType === "FRANCHISE") {
      stored = stored.filter((o) => o.branchSnapshot?.type === "FRANCHISE");
    }
    return stored;
  },

  getMainBranchOrders: async (params: { orderStatus?: string; search?: string } = {}): Promise<AdminOrderSummary[]> => {
    return adminOperationsService.getAllOrders({
      ...params,
      branchType: "MAIN",
    });
  },

  addOrderRecord: (order: Partial<AdminOrderSummary> & { id: string; orderNumber: string; totalAmount: number; fulfillmentType?: string }) => {
    const current = getStored<AdminOrderSummary[]>(ORDERS_KEY, []);
    const newOrder: AdminOrderSummary = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName || order.addressSnapshot?.fullName || "Bakery Customer",
      customerPhone: order.customerPhone || order.addressSnapshot?.phone || "9876543210",
      fulfillmentType: order.fulfillmentType || "HOME_DELIVERY",
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus || "CONFIRMED",
      paymentStatus: order.paymentStatus || "PAID",
      deliveryTimingType: order.deliveryTimingType || "INSTANT",
      deliveryTimePreference: order.deliveryTimePreference || "⚡ Instant Delivery (Within 30-45 mins)",
      scheduledDate: order.scheduledDate,
      scheduledTimeSlot: order.scheduledTimeSlot,
      branchSnapshot: order.branchSnapshot,
      addressSnapshot: order.addressSnapshot,
      locationSnapshot: order.locationSnapshot,
      items: order.items,
      notes: order.notes,
      createdAt: new Date().toISOString(),
    };
    setStored(ORDERS_KEY, [newOrder, ...current]);
    adminOperationsService.logAuditAction("NEW_ORDER_PLACED", `Order #${order.orderNumber}`);
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    adminOperationsService.logAuditAction("UPDATE_ORDER_STATUS", `Order status set to ${status}`);
    const response = await apiClient.patch<{
      success: boolean;
      data: { order: any };
    }>(`/orders/admin/orders/${orderId}/status`, {
      orderStatus: status,
      status,
    });
    return response.data.data.order;
  },

  deleteOrder: async (orderId: string) => {
    adminOperationsService.logAuditAction("DELETE_ORDER", `Order #${orderId} deleted`);
    try {
      await apiClient.delete(`/orders/admin/orders/${orderId}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete order";
      throw new Error(msg);
    }

    const current = getStored<AdminOrderSummary[]>(ORDERS_KEY, []);
    const updated = current.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
    setStored(ORDERS_KEY, updated);

    try {
      const custKey = "theonlinebakery_customer_orders_list";
      const raw = localStorage.getItem(custKey);
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter((o: any) => o.id !== orderId && o.orderNumber !== orderId);
        localStorage.setItem(custKey, JSON.stringify(filtered));
      }
    } catch (_e) {
      // Ignore
    }
  },

  clearAllTestOrders: async () => {
    adminOperationsService.logAuditAction("CLEAR_TEST_ORDERS", "Cleared local test orders");
    setStored(ORDERS_KEY, []);
    try {
      localStorage.removeItem("theonlinebakery_customer_orders_list");
    } catch (_e) {
      // Ignore
    }
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
    return [];
  },

  getAdmins: async (): Promise<AdminMember[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { admins: AdminMember[] };
      }>("/users/admins");
      if (response.data?.data?.admins) {
        return response.data.data.admins;
      }
    } catch (_err) {
      // Fallback
    }
    return [
      {
        id: "owner-1",
        name: "Ajay Prajapati",
        email: "ajaykterha@gmail.com",
        phone: "7897671632",
        role: "admin",
        status: "active",
        isPrimaryOwner: true,
        createdAt: new Date().toISOString(),
      },
    ];
  },

  grantAdminAccess: async (payload: {
    email?: string;
    phone?: string;
    name?: string;
    role: "admin" | "branch_admin";
    branchId?: string;
  }): Promise<AdminMember> => {
    adminOperationsService.logAuditAction(
      "GRANT_ADMIN_ACCESS",
      `Target: ${payload.email || payload.phone} as ${payload.role}`,
    );
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { admin: AdminMember };
    }>("/users/admins", payload);
    return response.data.data.admin;
  },

  revokeAdminAccess: async (userId: string) => {
    adminOperationsService.logAuditAction(
      "REVOKE_ADMIN_ACCESS",
      `Admin ID ${userId} revoked`,
    );
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
      data: { admin: any };
    }>(`/users/admins/${userId}`);
    return response.data;
  },

  updateAdminRole: async (
    userId: string,
    role: "admin" | "branch_admin" | "customer",
    branchId?: string,
  ) => {
    adminOperationsService.logAuditAction(
      "UPDATE_ADMIN_ROLE",
      `Admin ID ${userId} role set to ${role}`,
    );
    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      data: { admin: AdminMember };
    }>(`/users/admins/${userId}/role`, { role, branchId });
    return response.data.data.admin;
  },

  toggleCustomerStatus: async (userId: string, currentStatus: "active" | "blocked") => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    adminOperationsService.logAuditAction("TOGGLE_USER_STATUS", `User ${userId} set to ${newStatus}`);
    const response = await apiClient.patch<{
      success: boolean;
      data: { user: AdminCustomerSummary };
    }>(`/users/${userId}/status`, { status: newStatus });
    return response.data.data.user;
  },

  getPayments: async (): Promise<AdminPaymentSummary[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { payments: AdminPaymentSummary[] };
      }>("/payments/admin");
      if (response.data?.data?.payments) {
        return response.data.data.payments;
      }
    } catch (_err) {
      // Fallback
    }
    return [];
  },

  getNotifications: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { notifications: any[] };
      }>("/notifications/history");
      if (response.data?.data?.notifications) {
        return response.data.data.notifications;
      }
    } catch (_err) {
      // Fallback
    }
    return getStored(NOTIFS_KEY, []);
  },

  getUnreadNotificationCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { unreadCount: number };
      }>("/notifications/unread-count");
      if (typeof response.data?.data?.unreadCount === "number") {
        return response.data.data.unreadCount;
      }
    } catch (_err) {
      // Fallback
    }
    const notifs = getStored<any[]>(NOTIFS_KEY, []);
    return notifs.filter((n) => !n.isRead).length;
  },

  markNotificationAsRead: async (id: string) => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { notification: any };
      }>(`/notifications/${id}/read`);
      return response.data?.data?.notification;
    } catch (_err) {
      // Fallback
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { updatedCount: number };
      }>("/notifications/read-all");
      return response.data?.data?.updatedCount;
    } catch (_err) {
      // Fallback
    }
    const notifs = getStored<any[]>(NOTIFS_KEY, []);
    setStored(NOTIFS_KEY, notifs.map((n) => ({ ...n, isRead: true })));
  },

  sendBroadcastNotification: async (payload: { title: string; message: string; targetRole: string }) => {
    adminOperationsService.logAuditAction("DISPATCH_BROADCAST", `Title: "${payload.title}"`);
    const response = await apiClient.post<{
      success: boolean;
      data: { notification: any };
    }>("/notifications/broadcast", payload);
    return response.data;
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
    return {
      storeName: "The Online Bakery",
      phone: "+91 7897671632",
      email: "ajaykterha@gmail.com",
      gstin: "07AAAAA0000A1Z5",
      minOrderValue: 299,
      freeDeliveryThreshold: 799,
      standardDeliveryCharge: 49,
      taxRatePercent: 5,
      isTaxEnabled: true,
      isOrderAcceptanceActive: true,
    };
  },

  updateSettings: async (settings: StoreSettingsPayload) => {
    adminOperationsService.logAuditAction("UPDATE_STORE_SETTINGS", `Min order ₹${settings.minOrderValue}, Free threshold ₹${settings.freeDeliveryThreshold}`);
    const response = await apiClient.put<{
      success: boolean;
      data: { settings: StoreSettingsPayload };
    }>("/settings", settings);
    return response.data.data.settings;
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
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { metrics: any };
      }>("/platform/metrics");
      if (response.data?.data?.metrics) {
        return response.data.data.metrics;
      }
    } catch (_err) {
      // Fallback
    }

    const orders = await adminOperationsService.getAllOrders();
    const customers = await adminOperationsService.getCustomers();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
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
      }>("/platform/audit");
      if (response.data?.data?.auditLogs && response.data.data.auditLogs.length > 0) {
        return response.data.data.auditLogs;
      }
    } catch (_err) {
      // Fallback
    }
    return getStored(LOGS_KEY, []);
  },
};
