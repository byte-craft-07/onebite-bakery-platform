import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import { toObjectId } from "../../../db/utils/object-id.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type {
  NotificationHistoryQueryDto,
  SendNotificationDto,
} from "../dto/index.js";
import type { NotificationService } from "../service/index.js";
import { WebPushService } from "../service/web-push.service.js";
import { PushSubscriptionRepository } from "../repository/push-subscription.repository.js";

export class NotificationController {
  private readonly webPushService: WebPushService;
  private readonly pushSubscriptionRepository: PushSubscriptionRepository;

  public constructor(
    private readonly notificationService: NotificationService,
    webPushService?: WebPushService,
    pushSubscriptionRepository?: PushSubscriptionRepository,
  ) {
    this.webPushService = webPushService ?? new WebPushService();
    this.pushSubscriptionRepository =
      pushSubscriptionRepository ?? new PushSubscriptionRepository();
  }

  public send = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const notification = await this.notificationService.send(
      request.body as SendNotificationDto,
      authenticatedRequest.user.role,
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Notification processed and sent successfully.",
      data: { notification },
    });
  };

  public getHistory = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const result = await this.notificationService.getHistory(
      authenticatedRequest.user.id,
      authenticatedRequest.user.role,
      request.query as unknown as NotificationHistoryQueryDto,
    );

    return sendSuccess(response, {
      message: "Notification history retrieved successfully.",
      data: result,
    });
  };

  public getNotificationById = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const id = this.getIdParam(request);

    const notification = await this.notificationService.getNotificationById(
      authenticatedRequest.user.id,
      authenticatedRequest.user.role,
      id,
    );

    return sendSuccess(response, {
      message: "Notification retrieved successfully.",
      data: { notification },
    });
  };

  public getUnreadCount = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const unreadCount = await this.notificationService.getUnreadCount(
      authenticatedRequest.user.id,
      authenticatedRequest.user.role,
    );

    return sendSuccess(response, {
      message: "Unread notifications count retrieved successfully.",
      data: { unreadCount },
    });
  };

  public markAsRead = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const id = this.getIdParam(request);

    const notification = await this.notificationService.markAsRead(
      authenticatedRequest.user.id,
      authenticatedRequest.user.role,
      id,
    );

    return sendSuccess(response, {
      message: "Notification marked as read.",
      data: { notification },
    });
  };

  public markAllAsRead = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const updatedCount = await this.notificationService.markAllAsRead(
      authenticatedRequest.user.id,
      authenticatedRequest.user.role,
    );

    return sendSuccess(response, {
      message: "All notifications marked as read.",
      data: { updatedCount },
    });
  };

  public getVapidPublicKey = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const publicKey = this.webPushService.getVapidPublicKey();
    return sendSuccess(response, {
      message: "VAPID public key retrieved successfully.",
      data: { publicKey },
    });
  };

  public registerPushSubscription = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const userObjId = toObjectId(authenticatedRequest.user.id);
    const body = request.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      deviceInfo?: Record<string, unknown>;
      userAgent?: string;
    };

    const subscription = await this.pushSubscriptionRepository.upsertSubscription(
      userObjId,
      {
        endpoint: body.endpoint,
        keys: body.keys,
        deviceInfo: body.deviceInfo,
        userAgent: body.userAgent || request.headers["user-agent"],
      },
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Web Push subscription registered successfully for this device.",
      data: {
        subscription: {
          id: subscription._id.toString(),
          endpoint: subscription.endpoint,
          isActive: subscription.isActive,
        },
      },
    });
  };

  public unsubscribePush = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const userObjId = toObjectId(authenticatedRequest.user.id);
    const { endpoint } = request.body as { endpoint: string };

    const removed = await this.pushSubscriptionRepository.deleteByEndpoint(
      userObjId,
      endpoint,
    );

    return sendSuccess(response, {
      message: removed
        ? "Push subscription removed successfully."
        : "Subscription was not active or already removed.",
      data: { success: removed },
    });
  };

  public sendTestPush = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const { endpoint } = request.body as { endpoint?: string };

    const result = await this.webPushService.sendTestPush(
      authenticatedRequest.user.id,
      endpoint,
    );

    return sendSuccess(response, {
      message: result.message,
      data: result,
    });
  };

  public retryNotification = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const id = this.getIdParam(request);

    const notification = await this.notificationService.retry(id);

    return sendSuccess(response, {
      message: "Notification retried successfully.",
      data: { notification },
    });
  };

  private getIdParam(request: Request): string {
    const id = request.params.id;

    if (typeof id !== "string") {
      throw new Error("Validated notification id parameter is missing.");
    }

    return id;
  }
}
