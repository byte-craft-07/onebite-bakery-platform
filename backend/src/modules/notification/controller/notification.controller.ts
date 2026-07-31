import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type {
  NotificationHistoryQueryDto,
  SendNotificationDto,
} from "../dto/index.js";
import type { NotificationService } from "../service/index.js";

export class NotificationController {
  public constructor(private readonly notificationService: NotificationService) {}

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
