import { logger } from "../../../shared/utils/logger.js";
import { toObjectId } from "../../../db/utils/object-id.js";
import { UserRepository } from "../../user/index.js";
import type { OrderResponse } from "../../order/types/index.js";
import type { NotificationResponse } from "../types/index.js";
import type { SendNotificationDto } from "../dto/index.js";
import type { NotificationService } from "./notification.service.js";
import { broadcastNewOrderNotification } from "../../../socket/index.js";

import { WebPushService } from "./web-push.service.js";

type OrderNotificationEvent = "created" | "status-updated" | "cancelled";

const formatStatus = (status: string): string => status.replace(/_/g, " ");

const normalizePhone = (phone?: string): string | undefined => {
  const digits = phone?.replace(/\D/g, "").slice(-10);
  return digits && /^[6-9]\d{9}$/.test(digits) ? digits : undefined;
};

export class OrderNotificationService {
  public constructor(
    private readonly notificationService: NotificationService,
    private readonly userRepository = new UserRepository(),
    private readonly webPushService = new WebPushService(),
  ) {}

  public async dispatchOrderCreated(
    order: OrderResponse,
  ): Promise<NotificationResponse[]> {
    const results = await this.dispatch(order, "created");

    // Real-time admin broadcast & persistent record creation
    try {
      const user = await this.userRepository.findById(toObjectId(order.customerId));
      const customerName =
        order.addressSnapshot?.fullName || user?.name || "Customer";
      const customerPhone =
        order.addressSnapshot?.phone || user?.phone || "N/A";

      // 1. Create persistent in-app notification record for Admins
      const adminNotification = await this.notificationService.send({
        recipient: "ADMIN",
        type: "ORDER_CREATED",
        template: "admin-order-created",
        payload: {
          title: `New Order Received: #${order.orderNumber}`,
          message: `Customer ${customerName} placed order #${order.orderNumber} for ₹${order.pricingSnapshot.grandTotal}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName,
          customerPhone,
          totalAmount: order.pricingSnapshot.grandTotal,
          paymentMethod: order.paymentMethod ?? "UPI",
          deliveryMethod: order.deliveryMethod,
          deliveryTimingType: order.deliveryTimingType ?? "INSTANT",
          itemCount: order.items?.length || 0,
          items: (order.items || []).map((it) => ({
            name: it.productName,
            quantity: it.quantity,
          })),
        },
        provider: "IN_APP",
        orderId: order.id,
        orderNumber: order.orderNumber,
        isRead: false,
      });

      // 2. Broadcast via Socket.IO to connected active admin dashboards
      broadcastNewOrderNotification(
        {
          notificationId: adminNotification.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: {
            name: customerName,
            phone: customerPhone,
          },
          items: (order.items || []).map((it) => ({
            name: it.productName,
            quantity: it.quantity,
          })),
          totalAmount: order.pricingSnapshot.grandTotal,
          paymentMethod: order.paymentMethod ?? "UPI",
          orderType: order.deliveryMethod ?? "HOME_DELIVERY",
          createdAt:
            order.createdAt instanceof Date
              ? order.createdAt.toISOString()
              : String(order.createdAt),
        },
        order.branchId,
      );

      // 3. Dispatch Web Push notification to all registered admin devices (background / closed browsers)
      void this.webPushService.sendPushToAdmins(
        {
          notificationId: adminNotification.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName,
          totalAmount: order.pricingSnapshot.grandTotal,
          paymentMethod: order.paymentMethod ?? "UPI",
          orderType: order.deliveryMethod,
          branchId: order.branchId,
        },
        order.branchId,
      );

      results.push(adminNotification);
    } catch (socketError) {
      logger.error(
        {
          error: socketError,
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        "Failed to dispatch real-time admin order notification (non-fatal)",
      );
    }

    return results;
  }

  public async dispatchOrderStatusUpdated(
    order: OrderResponse,
  ): Promise<NotificationResponse[]> {
    return this.dispatch(
      order,
      order.orderStatus === "CANCELLED" ? "cancelled" : "status-updated",
    );
  }

  private async dispatch(
    order: OrderResponse,
    event: OrderNotificationEvent,
  ): Promise<NotificationResponse[]> {
    try {
      const user = await this.userRepository.findById(toObjectId(order.customerId));
      const customerName =
        order.addressSnapshot?.fullName || user?.name || "Customer";
      const recipientPhone = normalizePhone(
        order.addressSnapshot?.phone || user?.phone,
      );
      const commonPayload = {
        customerName,
        orderNumber: order.orderNumber,
        amount: order.pricingSnapshot.grandTotal,
        status: formatStatus(order.orderStatus),
        deliveryTime: order.estimatedReadyTime?.toISOString() ?? "soon",
        cancellationReason: order.cancellationReason ?? "Cancelled",
      };
      const template = this.resolveTemplate(event);
      const type = this.resolveType(event);
      const notifications: SendNotificationDto[] = [
        {
          userId: order.customerId,
          recipient: order.customerId,
          type,
          template,
          payload: {
            ...commonPayload,
            title: this.resolveTitle(order, event),
            message: this.resolveMessage(order, event),
          },
          provider: "IN_APP",
        },
      ];

      if (user?.email) {
        notifications.push({
          userId: order.customerId,
          recipient: user.email,
          type,
          template,
          payload: commonPayload,
          provider: "EMAIL",
        });
      }

      if (recipientPhone) {
        notifications.push({
          userId: order.customerId,
          recipient: recipientPhone,
          type,
          template,
          payload: commonPayload,
          provider: "WHATSAPP",
        });
      }

      const results = await this.notificationService.sendBulk(notifications);

      // Web Push dispatch to customer device (browser / PWA / mobile)
      void this.webPushService.sendPushToUser(order.customerId, {
        title: this.resolveTitle(order, event),
        body: this.resolveMessage(order, event),
        orderId: order.id,
        orderNumber: order.orderNumber,
        url: `/customer/orders/${order.id}`,
        type: type,
      });

      // If delivery agent is assigned, also dispatch push notification to agent device
      if (order.deliveryAgentId) {
        void this.webPushService.sendPushToUser(order.deliveryAgentId, {
          title: `🛵 Order #${order.orderNumber} • ${formatStatus(order.orderStatus)}`,
          body: `Customer: ${customerName} • Status: ${formatStatus(order.orderStatus)}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          url: `/agent/dashboard`,
          type: "DELIVERY_UPDATE",
        });
      }

      logger.info(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          event,
          sent: results.filter((item) => item.status === "SENT").length,
          failed: results.filter((item) => item.status === "FAILED").length,
        },
        "Order notifications dispatched",
      );
      return results;
    } catch (error) {
      logger.error(
        { error, orderId: order.id, orderNumber: order.orderNumber, event },
        "Order notification dispatch failed",
      );
      return [];
    }
  }

  private resolveTemplate(event: OrderNotificationEvent): string {
    if (event === "created") return "order-created";
    if (event === "cancelled") return "order-cancelled";
    return "order-status-updated";
  }

  private resolveType(event: OrderNotificationEvent): SendNotificationDto["type"] {
    if (event === "created") return "ORDER_CREATED";
    if (event === "cancelled") return "ORDER_CANCELLED";
    return "ORDER_STATUS_UPDATED";
  }

  private resolveTitle(order: OrderResponse, event: OrderNotificationEvent): string {
    if (event === "created") return `Order ${order.orderNumber} received`;
    if (event === "cancelled") return `Order ${order.orderNumber} cancelled`;
    return `Order ${order.orderNumber} is ${formatStatus(order.orderStatus)}`;
  }

  private resolveMessage(
    order: OrderResponse,
    event: OrderNotificationEvent,
  ): string {
    if (event === "created") {
      return "Your order has been received and is waiting for confirmation.";
    }

    if (event === "cancelled") {
      return `Your order has been cancelled. Reason: ${order.cancellationReason ?? "Cancelled"}.`;
    }

    return `Your order status changed to ${formatStatus(order.orderStatus)}.`;
  }
}
