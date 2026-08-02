import React, { useState } from "react";
import { Bell, CheckCircle2, Info, Package, Tag } from "lucide-react";

import { Badge, Card } from "@/components/ui/DisplayComponents";

interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: "ORDER_UPDATE" | "PROMO" | "SYSTEM";
  timestamp: string;
  isRead: boolean;
}

const INITIAL_NOTIFS: CustomerNotification[] = [
  {
    id: "cnt-1",
    title: "Order #OB-98210 Out for Delivery",
    message: "Your Belgian Dark Chocolate Truffle Cake order is out for delivery with our courier.",
    type: "ORDER_UPDATE",
    timestamp: "10 mins ago",
    isRead: false,
  },
  {
    id: "cnt-2",
    title: "20% OFF Birthday Cake Promo Code",
    message: "Use code BDAY20 on your next custom tier cake order.",
    type: "PROMO",
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "cnt-3",
    title: "Account Registered Successfully",
    message: "Welcome to OneBite Artisanal Bakery. Enjoy 100% eggless baked goods.",
    type: "SYSTEM",
    timestamp: "Yesterday",
    isRead: true,
  },
];

export const CustomerNotificationsPage: React.FC = () => {
  const [notifs, setNotifs] = useState<CustomerNotification[]>(INITIAL_NOTIFS);

  const markAllAsRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2C1E16]">Account Notifications & Alerts</h1>
          <p className="text-xs text-[#6E5D4F]">Section 44 &bull; Track live order delivery status and special bakery offers</p>
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          className="text-xs font-bold text-[#E67E22] hover:underline cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {notifs.map((item) => (
          <Card
            key={item.id}
            className={`flex items-start gap-4 p-5 transition-all ${
              item.isRead ? "bg-white border-[#E8E2D9]" : "bg-[#FFFBF5] border-[#E67E22]/40 shadow-xs"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-[#FFF3E6] text-[#E67E22] shrink-0">
              {item.type === "ORDER_UPDATE" ? (
                <Package className="h-5 w-5" />
              ) : item.type === "PROMO" ? (
                <Tag className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#2C1E16]">{item.title}</h3>
                <span className="text-[11px] text-gray-400">{item.timestamp}</span>
              </div>
              <p className="text-xs text-[#6E5D4F]">{item.message}</p>
            </div>

            {!item.isRead ? (
              <span className="h-2 w-2 rounded-full bg-[#E67E22] shrink-0 mt-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-1" />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
