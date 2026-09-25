import { io, type Socket } from "socket.io-client";

import { ENV } from "@/config/env.config";

export interface NewOrderEventPayload {
  notificationId: string;
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  items: {
    name: string;
    quantity: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
  orderType: string;
  createdAt: string;
}

type OrderNewListener = (order: NewOrderEventPayload) => void;
type ReconnectListener = () => void;

class SocketService {
  private socket: Socket | null = null;
  private orderNewListeners: Set<OrderNewListener> = new Set();
  private reconnectListeners: Set<ReconnectListener> = new Set();
  private isConnecting = false;
  private handledNotificationIds: Set<string> = new Set();

  public connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    // Resolve socket server base URL
    let socketUrl = (import.meta.env.VITE_SOCKET_URL as string | undefined) || "";
    if (!socketUrl && typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
      if (!isLocalhost && ENV.API_BASE_URL && !ENV.API_BASE_URL.startsWith("/")) {
        try {
          const urlObj = new URL(ENV.API_BASE_URL);
          socketUrl = urlObj.origin;
        } catch (_err) {
          socketUrl = "";
        }
      }
    }

    this.socket = io(socketUrl || window.location.origin, {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      this.isConnecting = false;
      // Dispatch custom browser event for UI status if needed
      window.dispatchEvent(new CustomEvent("onebitebakery_socket_connected"));
    });

    this.socket.on("connect_error", (error) => {
      this.isConnecting = false;
      console.warn("[SocketService] Connection error:", error.message);
    });

    this.socket.on("reconnect", () => {
      // Notify all reconnect listeners so missed notifications are fetched
      this.reconnectListeners.forEach((listener) => {
        try {
          listener();
        } catch (err) {
          console.error("[SocketService] Reconnect listener error:", err);
        }
      });
    });

    this.socket.on("order:new", (data: NewOrderEventPayload) => {
      if (!data || !data.orderNumber) return;

      // Duplicate notification protection (deduplication key)
      const dedupeKey = data.notificationId || `${data.orderId}_${data.orderNumber}`;
      if (this.handledNotificationIds.has(dedupeKey)) {
        return;
      }
      this.handledNotificationIds.add(dedupeKey);

      // Keep deduplication set bounded
      if (this.handledNotificationIds.size > 200) {
        const firstKeys = Array.from(this.handledNotificationIds).slice(0, 50);
        firstKeys.forEach((k) => this.handledNotificationIds.delete(k));
      }

      this.orderNewListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error("[SocketService] Order listener error:", err);
        }
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  public onNewOrder(listener: OrderNewListener): () => void {
    this.orderNewListeners.add(listener);
    return () => {
      this.orderNewListeners.delete(listener);
    };
  }

  public onReconnect(listener: ReconnectListener): () => void {
    this.reconnectListeners.add(listener);
    return () => {
      this.reconnectListeners.delete(listener);
    };
  }
}

export const socketService = new SocketService();
