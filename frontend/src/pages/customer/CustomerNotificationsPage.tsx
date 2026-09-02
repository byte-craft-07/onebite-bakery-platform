import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Info, Package, RefreshCw, Tag } from "lucide-react";

import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/services/api.client";

interface BackendNotification {
  id: string;
  type: string;
  provider: string;
  subject: string;
  recipient: string;
  status: "PENDING" | "QUEUED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
  payload: Record<string, unknown>;
  createdAt: string;
  sentAt?: string;
  failureReason?: string;
}

interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: "ORDER_UPDATE" | "PROMO" | "SYSTEM";
  timestamp: string;
  status: BackendNotification["status"];
  provider: string;
  isRead: boolean;
}

const READ_STORAGE_KEY = "theonlinebakery_read_notification_ids";

const getString = (
  payload: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const mapNotificationType = (type: string): CustomerNotification["type"] => {
  if (type.startsWith("ORDER_") || type.startsWith("PAYMENT_")) {
    return "ORDER_UPDATE";
  }

  if (type === "ADMIN_NOTIFICATION") {
    return "SYSTEM";
  }

  return "SYSTEM";
};

const toCustomerNotification = (
  notification: BackendNotification,
  readIds: Set<string>,
): CustomerNotification => {
  const title =
    getString(notification.payload, "title") ||
    notification.subject ||
    "The Online Bakery notification";
  const message =
    getString(notification.payload, "message") ||
    getString(notification.payload, "status") ||
    getString(notification.payload, "orderNumber") ||
    notification.failureReason ||
    "Your account has a new update.";

  return {
    id: notification.id,
    title,
    message,
    type: mapNotificationType(notification.type),
    timestamp: formatTimestamp(notification.sentAt || notification.createdAt),
    status: notification.status,
    provider: notification.provider,
    isRead: readIds.has(notification.id),
  };
};

export const CustomerNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "[]"));
    } catch (_err) {
      return new Set();
    }
  });

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const fetchNotifications = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { notifications: BackendNotification[] };
      }>("/notifications/history", {
        params: { limit: 50 },
      });

      const list = response.data.data.notifications
        .filter((item) => item.provider === "IN_APP")
        .map((item) => toCustomerNotification(item, readIds));
      setNotifications(list);
    } catch (_err) {
      setErrorMessage("Unable to load notifications right now.");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistReadIds = (nextReadIds: Set<string>) => {
    localStorage.setItem(
      READ_STORAGE_KEY,
      JSON.stringify(Array.from(nextReadIds)),
    );
    setReadIds(nextReadIds);
  };

  const markAllAsRead = () => {
    const nextReadIds = new Set([
      ...Array.from(readIds),
      ...notifications.map((item) => item.id),
    ]);
    persistReadIds(nextReadIds);
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true })),
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <Link
        to="/customer/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Account Hub</span>
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3B302B]">
            Account Notifications & Alerts
          </h1>
          <p className="text-xs text-[#7A6E65]">
            Live order updates, payment alerts, and account messages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#E5DEC9] bg-[#FFF8EC] px-4 py-3">
        <span className="text-xs font-semibold text-[#7A6E65]">
          Unread notifications
        </span>
        <Badge variant={unreadCount > 0 ? "warning" : "success"}>
          {unreadCount}
        </Badge>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </>
        ) : notifications.length > 0 ? (
          notifications.map((item) => (
            <Card
              key={item.id}
              className={`flex items-start gap-4 p-5 transition-all ${
                item.isRead
                  ? "bg-white border-[#E5DEC9]"
                  : "bg-[#FFF8EC] border-[#596B58]/40 shadow-xs"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#FFF8EC] text-[#596B58] shrink-0">
                {item.type === "ORDER_UPDATE" ? (
                  <Package className="h-5 w-5" />
                ) : item.type === "PROMO" ? (
                  <Tag className="h-5 w-5" />
                ) : (
                  <Info className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-[#3B302B]">{item.title}</h3>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[#7A6E65]">{item.message}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant={item.status === "FAILED" ? "danger" : "success"}>
                    {item.status}
                  </Badge>
                  <span className="text-[11px] text-gray-400">
                    {item.provider}
                  </span>
                </div>
              </div>

              {!item.isRead ? (
                <span className="h-2 w-2 rounded-full bg-[#596B58] shrink-0 mt-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-1" />
              )}
            </Card>
          ))
        ) : (
          <EmptyState
            title="No Notifications"
            description="Order updates and account alerts will appear here."
          />
        )}
      </div>
    </div>
  );
};
