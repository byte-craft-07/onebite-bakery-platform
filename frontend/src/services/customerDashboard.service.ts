import { addressService, type Address } from "./address.service";
import { apiClient } from "./api.client";
import { cartService } from "./cart.service";
import { favoritesService } from "./favorites.service";
import { orderService, type OrderDetails } from "./order.service";
import { reviewService } from "./review.service";

const CELEBRATION_KEY = "onebite_local_celebrations";
const TICKETS_KEY = "onebite_local_tickets";
const NOTIFS_KEY = "onebite_local_customer_notifs";

export interface CelebrationItem {
  id: string;
  title: string;
  type: "Birthday" | "Anniversary" | "Wedding" | "Baby Shower" | "Festival" | "Other";
  date: string;
  reminderEnabled: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
}

export interface CustomerNotificationItem {
  id: string;
  title: string;
  message: string;
  type: "ORDER_UPDATE" | "PROMO" | "SYSTEM";
  createdAt: string;
  isRead: boolean;
}

export interface CustomerAnalyticsSummary {
  totalOrders: number;
  runningOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  favoritesCount: number;
  totalSpent: number;
  totalCakesOrdered: number;
  favoriteCategory: string;
  averageOrderValue: number;
  memberSince: string;
  lastOrderDate: string | null;
}

export const customerDashboardService = {
  getAnalyticsSummary: async (): Promise<CustomerAnalyticsSummary> => {
    let orders: OrderDetails[] = [];
    try {
      orders = await orderService.getCustomerOrders();
    } catch (_err) {
      orders = [];
    }

    let favProds: any[] = [];
    try {
      favProds = await favoritesService.getFavorites();
    } catch (_err) {
      favProds = [];
    }

    const totalOrders = orders.length;
    const runningOrders = orders.filter(
      (o) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.orderStatus)
    );
    const deliveredOrders = orders.filter((o) => o.orderStatus === "DELIVERED");
    const cancelledOrders = orders.filter((o) => o.orderStatus === "CANCELLED");

    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

    let totalCakes = 0;
    const categoryCounts: Record<string, number> = {};

    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.name.toLowerCase().includes("cake")) {
          totalCakes += item.quantity;
        }
        const cat = item.name.includes("Cake") ? "Artisanal Cakes" : "Pastries & Breads";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
      });
    });

    let topCategory = "Artisanal Cakes";
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

    return {
      totalOrders,
      runningOrdersCount: runningOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      favoritesCount: favProds.length,
      totalSpent,
      totalCakesOrdered: totalCakes || totalOrders,
      favoriteCategory: topCategory,
      averageOrderValue,
      memberSince: "January 2026",
      lastOrderDate,
    };
  },

  getCelebrations: (): CelebrationItem[] => {
    try {
      const stored = localStorage.getItem(CELEBRATION_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_e) {
      // Fallback
    }
    return [
      {
        id: "cel-1",
        title: "Ajay's Birthday Celebration",
        type: "Birthday",
        date: "2026-08-15",
        reminderEnabled: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cel-2",
        title: "Parents' 25th Anniversary",
        type: "Anniversary",
        date: "2026-11-20",
        reminderEnabled: true,
        createdAt: new Date().toISOString(),
      },
    ];
  },

  addCelebration: (item: Omit<CelebrationItem, "id" | "createdAt">): CelebrationItem => {
    const celebrations = customerDashboardService.getCelebrations();
    const newItem: CelebrationItem = {
      ...item,
      id: `cel-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...celebrations];
    localStorage.setItem(CELEBRATION_KEY, JSON.stringify(updated));
    return newItem;
  },

  deleteCelebration: (id: string): void => {
    const celebrations = customerDashboardService.getCelebrations();
    const updated = celebrations.filter((c) => c.id !== id);
    localStorage.setItem(CELEBRATION_KEY, JSON.stringify(updated));
  },

  getSupportTickets: (): SupportTicket[] => {
    try {
      const stored = localStorage.getItem(TICKETS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_e) {
      // Fallback
    }
    return [
      {
        id: "tkt-101",
        subject: "Eggless Custom Tier Cake Consultation",
        category: "Custom Cake Inquiry",
        message: "Requesting eggless chocolate ganache 3-tier custom cake for wedding reception.",
        status: "RESOLVED",
        createdAt: "2026-07-28T10:00:00Z",
      },
    ];
  },

  createSupportTicket: (ticket: { subject: string; category: string; message: string }): SupportTicket => {
    const existing = customerDashboardService.getSupportTickets();
    const newTkt: SupportTicket = {
      id: `tkt-${Math.floor(100 + Math.random() * 900)}`,
      ...ticket,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    const updated = [newTkt, ...existing];
    localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
    return newTkt;
  },

  getCustomerNotifications: (): CustomerNotificationItem[] => {
    try {
      const stored = localStorage.getItem(NOTIFS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_e) {
      // Fallback
    }
    return [
      {
        id: "not-1",
        title: "Order #OB-98210 Dispatched",
        message: "Your Belgian Dark Chocolate Truffle Cake is out for temperature-controlled delivery.",
        type: "ORDER_UPDATE",
        createdAt: new Date().toISOString(),
        isRead: false,
      },
      {
        id: "not-2",
        title: "20% OFF Weekend Bakery Coupon",
        message: "Use code BDAY20 on your next artisanal cake order.",
        type: "PROMO",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        isRead: false,
      },
    ];
  },

  markNotificationRead: (id: string): void => {
    const list = customerDashboardService.getCustomerNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
  },

  deleteNotification: (id: string): void => {
    const list = customerDashboardService.getCustomerNotifications();
    const updated = list.filter((n) => n.id !== id);
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
  },
};
