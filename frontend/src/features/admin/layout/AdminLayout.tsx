import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "@/contexts/auth.context";
import { socketService, type NewOrderEventPayload } from "@/services/socket.service";
import { playOrderNotificationSound, getSoundSettings } from "@/utils/sound.util";
import { PushNotificationModal } from "@/components/pwa/PushNotificationModal";
import { NewOrderNotificationModal } from "../components/NewOrderNotificationModal";
import { AdminErrorBoundary } from "../components/AdminErrorBoundary";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [ordersQueue, setOrdersQueue] = useState<NewOrderEventPayload[]>([]);

  useEffect(() => {
    // Only connect real-time socket for authorized admin users
    if (user?.role === "admin" || user?.role === "branch_admin") {
      socketService.connect();

      const unsubscribeNewOrder = socketService.onNewOrder((newOrder) => {
        // Enqueue new order for visual popup
        const settings = getSoundSettings();
        if (settings.notificationsEnabled) {
          setOrdersQueue((prev) => {
            // Check if already in queue
            if (prev.some((o) => o.orderId === newOrder.orderId || o.orderNumber === newOrder.orderNumber)) {
              return prev;
            }
            return [...prev, newOrder];
          });
        }

        // Play audio chime
        void playOrderNotificationSound();

        // Notify Topbar and other listening admin views to refresh unread badge and order table
        window.dispatchEvent(new CustomEvent("onebitebakery_refresh_notifications"));
        window.dispatchEvent(new CustomEvent("onebitebakery_new_order_received", { detail: newOrder }));
      });

      const unsubscribeReconnect = socketService.onReconnect(() => {
        // Reconnected: refresh missed notifications
        window.dispatchEvent(new CustomEvent("onebitebakery_refresh_notifications"));
      });

      return () => {
        unsubscribeNewOrder();
        unsubscribeReconnect();
      };
    }
  }, [user?.role]);

  const handleDismissOrder = (orderId: string) => {
    setOrdersQueue((prev) => prev.filter((o) => o.orderId !== orderId));
  };

  const handleDismissAll = () => {
    setOrdersQueue([]);
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] text-[#3B302B] flex">
      {/* Sidebar */}
      <Sidebar isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuToggle={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </main>
      </div>

      {/* Real-Time New Order Popup Modal */}
      <NewOrderNotificationModal
        ordersQueue={ordersQueue}
        onDismiss={handleDismissOrder}
        onDismissAll={handleDismissAll}
      />

      {/* Push Notification Permission Modal */}
      <PushNotificationModal />
    </div>
  );
};
