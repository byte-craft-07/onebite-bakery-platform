import type { Types } from "mongoose";
import webpush from "web-push";

import { env } from "../../../config/env.js";
import { toObjectId } from "../../../db/utils/object-id.js";
import { logger } from "../../../shared/utils/logger.js";
import { PushSubscriptionRepository } from "../repository/push-subscription.repository.js";

export interface WebPushOrderPayload {
  notificationId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  orderType?: string;
  branchId?: string;
}

export interface UserWebPushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  orderId?: string;
  orderNumber?: string;
  type?: string;
  data?: Record<string, unknown>;
}

export class WebPushService {
  private readonly vapidPublicKey: string;
  private readonly vapidPrivateKey: string;
  private readonly vapidSubject: string;

  public constructor(
    private readonly pushSubscriptionRepository = new PushSubscriptionRepository(),
    vapidKeys?: { publicKey: string; privateKey: string; subject: string },
  ) {
    if (vapidKeys) {
      this.vapidPublicKey = vapidKeys.publicKey;
      this.vapidPrivateKey = vapidKeys.privateKey;
      this.vapidSubject = vapidKeys.subject;
    } else if (env.vapidPublicKey && env.vapidPrivateKey) {
      this.vapidPublicKey = env.vapidPublicKey;
      this.vapidPrivateKey = env.vapidPrivateKey;
      this.vapidSubject = env.vapidSubject;
    } else {
      // In development / test environment, auto-generate standard VAPID keypair for zero-config onboarding
      const generated = webpush.generateVAPIDKeys();
      this.vapidPublicKey = generated.publicKey;
      this.vapidPrivateKey = generated.privateKey;
      this.vapidSubject = env.vapidSubject || "mailto:admin@theonlinebakery.in";

      logger.info(
        { publicKey: this.vapidPublicKey },
        "Auto-generated development VAPID keypair for Web Push",
      );
    }

    try {
      webpush.setVapidDetails(
        this.vapidSubject,
        this.vapidPublicKey,
        this.vapidPrivateKey,
      );
    } catch (err) {
      logger.error({ error: err }, "Failed to configure Web Push VAPID details");
    }
  }

  public getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  public async sendPushToAdmins(
    payload: WebPushOrderPayload,
    branchId?: string,
  ): Promise<{ sent: number; failed: number; cleanedUp: number }> {
    const branchObjId = branchId ? toObjectId(branchId) : undefined;
    const subscriptions =
      await this.pushSubscriptionRepository.findAllActiveAdminSubscriptions(
        branchObjId,
      );

    if (!subscriptions || subscriptions.length === 0) {
      logger.debug(
        { orderNumber: payload.orderNumber },
        "No active admin push subscriptions registered",
      );
      return { sent: 0, failed: 0, cleanedUp: 0 };
    }

    const pushData = JSON.stringify({
      type: "NEW_ORDER",
      notificationId: payload.notificationId,
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      customerName: payload.customerName,
      totalAmount: payload.totalAmount,
      paymentMethod: payload.paymentMethod,
      orderType: payload.orderType || "HOME_DELIVERY",
      url: `/admin/orders?search=${encodeURIComponent(payload.orderNumber)}`,
      title: "🔔 New Order Received!",
      body: `Order #${payload.orderNumber} • ${payload.customerName} • ₹${payload.totalAmount}`,
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;
    let cleanedUp = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            pushData,
            {
              TTL: 60 * 60 * 24, // 24 hours
              urgency: "high",
            },
          );
          sent++;
        } catch (error: unknown) {
          failed++;
          const statusCode = (error as { statusCode?: number })?.statusCode;

          // HTTP 404 (Not Found) or 410 (Gone) indicates expired or unsubscribed endpoint
          if (statusCode === 404 || statusCode === 410) {
            cleanedUp++;
            logger.info(
              {
                endpoint: sub.endpoint,
                userId: sub.userId.toString(),
                statusCode,
              },
              "Deactivating expired/invalid push subscription",
            );
            await this.pushSubscriptionRepository.deactivateSubscription(
              sub.endpoint,
            );
          } else {
            logger.warn(
              {
                error: (error as { message?: string })?.message || String(error),
                userId: sub.userId.toString(),
                statusCode,
              },
              "Web Push delivery error for admin device",
            );
          }
        }
      }),
    );

    logger.info(
      {
        orderNumber: payload.orderNumber,
        totalSubscriptions: subscriptions.length,
        sent,
        failed,
        cleanedUp,
      },
      "Web Push notifications dispatched for new order",
    );

    return { sent, failed, cleanedUp };
  }

  public async sendPushToUser(
    userId: string | Types.ObjectId,
    payload: UserWebPushPayload,
  ): Promise<{ sent: number; failed: number; cleanedUp: number }> {
    const userObjId = typeof userId === "string" ? toObjectId(userId) : userId;
    const subscriptions =
      await this.pushSubscriptionRepository.findActiveByUserId(userObjId);

    if (!subscriptions || subscriptions.length === 0) {
      logger.debug(
        { userId: userObjId.toString() },
        "No active push subscriptions registered for user",
      );
      return { sent: 0, failed: 0, cleanedUp: 0 };
    }

    const pushData = JSON.stringify({
      type: payload.type || "ORDER_UPDATE",
      title: payload.title,
      body: payload.body,
      url: payload.url || (payload.orderId ? `/customer/orders/${payload.orderId}` : "/customer/orders"),
      tag: payload.tag || (payload.orderNumber ? `order-${payload.orderNumber}` : "customer-notification"),
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      timestamp: Date.now(),
      ...(payload.data ? payload.data : {}),
    });

    let sent = 0;
    let failed = 0;
    let cleanedUp = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            pushData,
            {
              TTL: 60 * 60 * 24, // 24 hours
              urgency: "high",
            },
          );
          sent++;
        } catch (error: unknown) {
          failed++;
          const statusCode = (error as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            cleanedUp++;
            await this.pushSubscriptionRepository.deactivateSubscription(
              sub.endpoint,
            );
          } else {
            logger.warn(
              {
                error: (error as { message?: string })?.message || String(error),
                userId: sub.userId.toString(),
                statusCode,
              },
              "Web Push delivery error for customer device",
            );
          }
        }
      }),
    );

    return { sent, failed, cleanedUp };
  }

  public async sendPushToUsers(
    userIds: (string | Types.ObjectId)[],
    payload: UserWebPushPayload,
  ): Promise<{ sent: number; failed: number; cleanedUp: number }> {
    let totalSent = 0;
    let totalFailed = 0;
    let totalCleanedUp = 0;

    await Promise.all(
      userIds.map(async (id) => {
        const res = await this.sendPushToUser(id, payload);
        totalSent += res.sent;
        totalFailed += res.failed;
        totalCleanedUp += res.cleanedUp;
      }),
    );

    return { sent: totalSent, failed: totalFailed, cleanedUp: totalCleanedUp };
  }

  public async sendTestPush(
    userId: string,
    endpoint?: string,
  ): Promise<{ success: boolean; message: string }> {
    const userObjId = toObjectId(userId);
    const subscriptions = await this.pushSubscriptionRepository.findActiveByUserId(userObjId);

    const targetSubscriptions = endpoint
      ? subscriptions.filter((s) => s.endpoint === endpoint)
      : subscriptions;

    if (!targetSubscriptions || targetSubscriptions.length === 0) {
      return {
        success: false,
        message: "No active push subscription found for this device.",
      };
    }

    const testPayload = JSON.stringify({
      type: "TEST_NOTIFICATION",
      title: "🔔 Push Notifications Active!",
      body: "Your device is connected and ready to receive real-time order alerts.",
      url: "/customer/orders",
      timestamp: Date.now(),
    });

    let anySuccess = false;
    for (const sub of targetSubscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          testPayload,
          { TTL: 60, urgency: "high" },
        );
        anySuccess = true;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await this.pushSubscriptionRepository.deactivateSubscription(
            sub.endpoint,
          );
        }
      }
    }

    return {
      success: anySuccess,
      message: anySuccess
        ? "Test push notification sent successfully!"
        : "Failed to deliver test push notification to device.",
    };
  }
}
