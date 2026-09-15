import { Types, type HydratedDocument } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import webpush from "web-push";

import { type PushSubscription } from "../model/index.js";
import type { PushSubscriptionRepository } from "../repository/push-subscription.repository.js";
import { WebPushService } from "./web-push.service.js";

const adminId = new Types.ObjectId().toString();

const createMockSubscriptionDoc = (
  overrides: Partial<PushSubscription> = {},
): HydratedDocument<PushSubscription> => {
  const doc = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(adminId),
    endpoint: "https://fcm.googleapis.com/fcm/send/sample-token-123",
    keys: {
      p256dh: "BMockP256dhKeyExampleStringForTestingPurpose123456789",
      auth: "MockAuthKey123456",
    },
    isActive: true,
    failureCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return doc as unknown as HydratedDocument<PushSubscription>;
};

describe("WebPushService", () => {
  let mockRepo: PushSubscriptionRepository;
  let service: WebPushService;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockRepo = {
      upsertSubscription: vi.fn().mockResolvedValue(createMockSubscriptionDoc()),
      findActiveByUserId: vi.fn().mockResolvedValue([createMockSubscriptionDoc()]),
      findActiveByUserIds: vi.fn().mockResolvedValue([createMockSubscriptionDoc()]),
      findAllActiveAdminSubscriptions: vi
        .fn()
        .mockResolvedValue([createMockSubscriptionDoc()]),
      deactivateSubscription: vi.fn().mockResolvedValue(true),
      deleteByEndpoint: vi.fn().mockResolvedValue(true),
    } as unknown as PushSubscriptionRepository;

    service = new WebPushService(mockRepo);
  });

  it("returns a valid VAPID public key", () => {
    const key = service.getVapidPublicKey();
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(10);
  });

  it("successfully dispatches push notifications to active admin devices", async () => {
    const sendNotificationSpy = vi
      .spyOn(webpush, "sendNotification")
      .mockResolvedValue({ statusCode: 201, body: "", headers: {} } as unknown as webpush.SendResult);

    const result = await service.sendPushToAdmins({
      notificationId: "notif_123",
      orderNumber: "BK-1001",
      orderId: "order_123",
      customerName: "John Doe",
      totalAmount: 450,
      paymentMethod: "UPI",
    });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(sendNotificationSpy).toHaveBeenCalledOnce();
  });

  it("automatically deactivates subscription when push service responds with 410 Gone", async () => {
    const error410 = Object.assign(new Error("Subscription expired"), { statusCode: 410 });

    vi.spyOn(webpush, "sendNotification").mockRejectedValue(error410);

    const result = await service.sendPushToAdmins({
      notificationId: "notif_123",
      orderId: "order_123",
      orderNumber: "BK-1001",
      customerName: "John",
      totalAmount: 500,
      paymentMethod: "COD",
    });

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.cleanedUp).toBe(1);
    expect(mockRepo.deactivateSubscription).toHaveBeenCalledWith(
      "https://fcm.googleapis.com/fcm/send/sample-token-123",
    );
  });

  it("handles empty subscription list gracefully without error", async () => {
    vi.mocked(mockRepo.findAllActiveAdminSubscriptions).mockResolvedValueOnce([]);

    const result = await service.sendPushToAdmins({
      notificationId: "notif_123",
      orderId: "order_123",
      orderNumber: "BK-1001",
      customerName: "John",
      totalAmount: 500,
      paymentMethod: "COD",
    });

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.cleanedUp).toBe(0);
  });
});
