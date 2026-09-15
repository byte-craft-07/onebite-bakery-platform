import { Types, type HydratedDocument } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import { type Notification } from "../model/index.js";
import type { INotificationProvider } from "../provider/index.js";
import type { NotificationRepository } from "../repository/index.js";
import { NotificationService } from "./notification.service.js";

const customerId = new Types.ObjectId().toString();
const notificationId = new Types.ObjectId();

const createMockNotificationDocument = (
  overrides: Partial<Notification> = {},
): HydratedDocument<Notification> => {
  const notification = {
    _id: notificationId,
    userId: new Types.ObjectId(customerId),
    type: "ORDER_CREATED",
    provider: "EMAIL",
    template: "order-created",
    subject: "The Online Bakery Order Received - OB20260001",
    recipient: "jane@example.com",
    status: "SENT",
    payload: { customerName: "Jane", orderNumber: "OB20260001", amount: 500 },
    retryCount: 0,
    sentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return notification as unknown as HydratedDocument<Notification>;
};

const createService = (
  notificationRepoOverrides: Partial<Record<keyof NotificationRepository, unknown>> = {},
  providerOverrides: Partial<INotificationProvider> = {},
) => {
  const notificationRepository = {
    create: vi
      .fn()
      .mockImplementation((data: Partial<Notification>) =>
        Promise.resolve(createMockNotificationDocument(data)),
      ),
    findById: vi.fn().mockResolvedValue(createMockNotificationDocument()),
    findHistory: vi.fn().mockResolvedValue({
      items: [createMockNotificationDocument()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    updateStatus: vi
      .fn()
      .mockImplementation((id, status, extra) =>
        Promise.resolve(createMockNotificationDocument({ _id: id, status, ...extra })),
      ),
    ...notificationRepoOverrides,
  } as unknown as NotificationRepository;

  const mockProvider: INotificationProvider = {
    providerName: "EMAIL",
    send: vi.fn().mockResolvedValue({
      success: true,
      providerMessageId: "msg_mock_123",
    }),
    ...providerOverrides,
  };

  return {
    service: new NotificationService(notificationRepository, mockProvider),
    notificationRepository,
    mockProvider,
  };
};

describe("NotificationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends email notification as admin, renders template variables, and updates status to SENT", async () => {
    const { service, notificationRepository, mockProvider } = createService();

    const result = await service.send(
      {
        recipient: "jane@example.com",
        type: "ORDER_CREATED",
        template: "order-created",
        payload: { customerName: "Jane", orderNumber: "OB20260001", amount: 500 },
      },
      "admin",
    );

    expect(result.status).toBe("SENT");
    expect(result.subject).toContain("OB20260001");
    expect(mockProvider.send).toHaveBeenCalledOnce();
    expect(notificationRepository.create).toHaveBeenCalledOnce();
  });

  it("prevents customer from initiating arbitrary notification endpoint calls", async () => {
    const { service } = createService();

    await expect(
      service.send(
        {
          recipient: "test@example.com",
          type: "ORDER_CREATED",
          template: "order-created",
          payload: {},
        },
        "customer",
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("updates notification status to FAILED when email provider send fails", async () => {
    const { service } = createService({}, {
      send: vi.fn().mockResolvedValue({
        success: false,
        error: "SMTP connection timeout",
      }),
    });

    const result = await service.send(
      {
        recipient: "jane@example.com",
        type: "ORDER_CREATED",
        template: "order-created",
        payload: { customerName: "Jane", orderNumber: "OB20260001" },
      },
      "admin",
    );

    expect(result.status).toBe("FAILED");
    expect(result.failureReason).toBe("SMTP connection timeout");
  });

  it("allows retrying failed notifications when retry count is below maximum limit", async () => {
    const failedNotification = createMockNotificationDocument({
      status: "FAILED",
      retryCount: 1,
    });

    const { service, mockProvider } = createService({
      findById: vi.fn().mockResolvedValue(failedNotification),
    });

    const retried = await service.retry(notificationId.toString());

    expect(retried.status).toBe("SENT");
    expect(mockProvider.send).toHaveBeenCalledOnce();
  });

  it("rejects notification retry when maximum retry limit is reached", async () => {
    const exhaustedNotification = createMockNotificationDocument({
      status: "FAILED",
      retryCount: 3,
    });

    const { service } = createService({
      findById: vi.fn().mockResolvedValue(exhaustedNotification),
    });

    await expect(
      service.retry(notificationId.toString()),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("restricts customer notification history to their own user ID", async () => {
    const { service, notificationRepository } = createService();

    await service.getHistory(customerId, "customer", { page: 1 });

    expect(notificationRepository.findHistory).toHaveBeenCalledWith(
      new Types.ObjectId(customerId),
      { page: 1 },
    );
  });

  it("allows admin to view system-wide notification history", async () => {
    const { service, notificationRepository } = createService();

    await service.getHistory(customerId, "admin", { page: 1 });

    expect(notificationRepository.findHistory).toHaveBeenCalledWith(
      undefined,
      { page: 1 },
    );
  });

  it("retrieves unread notification count for admin and users", async () => {
    const { service, notificationRepository } = createService({
      getUnreadCount: vi.fn().mockResolvedValue(5),
    });

    const unread = await service.getUnreadCount(customerId, "admin");
    expect(unread).toBe(5);
    expect(notificationRepository.getUnreadCount).toHaveBeenCalledWith(undefined);
  });

  it("marks a single notification as read", async () => {
    const readDoc = createMockNotificationDocument({ isRead: true, readAt: new Date() });
    const { service, notificationRepository } = createService({
      markAsRead: vi.fn().mockResolvedValue(readDoc),
    });

    const result = await service.markAsRead(customerId, "admin", notificationId.toString());
    expect(result.isRead).toBe(true);
    expect(notificationRepository.markAsRead).toHaveBeenCalled();
  });

  it("marks all notifications as read", async () => {
    const { service, notificationRepository } = createService({
      markAllAsRead: vi.fn().mockResolvedValue(7),
    });

    const count = await service.markAllAsRead(customerId, "admin");
    expect(count).toBe(7);
    expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(undefined);
  });
});
