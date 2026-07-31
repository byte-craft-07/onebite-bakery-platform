import type { HydratedDocument } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { MAX_RETRY_LIMIT } from "../constants/index.js";
import type {
  NotificationHistoryQueryDto,
  SendNotificationDto,
} from "../dto/index.js";
import { type Notification } from "../model/index.js";
import { EmailProvider, type INotificationProvider } from "../provider/index.js";
import type { NotificationRepository } from "../repository/index.js";
import { TemplateRenderer } from "../template/index.js";
import type { NotificationResponse } from "../types/index.js";

export class NotificationService {
  private readonly provider: INotificationProvider;

  public constructor(
    private readonly notificationRepository: NotificationRepository,
    provider?: INotificationProvider,
  ) {
    this.provider = provider ?? new EmailProvider();
  }

  public async send(
    dto: SendNotificationDto,
    senderRole?: string,
  ): Promise<NotificationResponse> {
    if (senderRole && senderRole !== "admin") {
      throw new AppError(
        "Only admins can initiate arbitrary notifications.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    const rendered = TemplateRenderer.render(dto.template, dto.payload);
    const userObjId = dto.userId ? toObjectId(dto.userId) : undefined;

    const notificationDoc = await this.notificationRepository.create({
      ...(userObjId ? { userId: userObjId } : {}),
      type: dto.type,
      provider: dto.provider ?? "EMAIL",
      template: dto.template,
      subject: rendered.subject,
      recipient: dto.recipient,
      status: "PENDING",
      payload: dto.payload,
      retryCount: 0,
    });

    const sendResult = await this.provider.send(
      dto.recipient,
      rendered.subject,
      rendered.body,
    );

    if (sendResult.success) {
      notificationDoc.status = "SENT";
      notificationDoc.sentAt = new Date();
      await notificationDoc.save();
    } else {
      notificationDoc.status = "FAILED";
      notificationDoc.failureReason = sendResult.error ?? "Failed to send notification.";
      notificationDoc.retryCount = 1;
      await notificationDoc.save();
    }

    return this.toResponse(notificationDoc);
  }

  public async sendBulk(
    dtos: SendNotificationDto[],
    senderRole?: string,
  ): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];
    for (const dto of dtos) {
      const res = await this.send(dto, senderRole);
      results.push(res);
    }
    return results;
  }

  public async retry(id: string): Promise<NotificationResponse> {
    const notificationObjId = toObjectId(id);
    const notificationDoc = await this.notificationRepository.findById(
      notificationObjId,
    );

    if (!notificationDoc) {
      throw new AppError(
        "Notification record not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (notificationDoc.retryCount >= MAX_RETRY_LIMIT) {
      throw new AppError(
        `Maximum retry limit (${MAX_RETRY_LIMIT}) reached for this notification.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const rendered = TemplateRenderer.render(
      notificationDoc.template,
      notificationDoc.payload,
    );

    notificationDoc.status = "SENDING";
    await notificationDoc.save();

    const sendResult = await this.provider.send(
      notificationDoc.recipient,
      rendered.subject,
      rendered.body,
    );

    if (sendResult.success) {
      notificationDoc.status = "SENT";
      notificationDoc.sentAt = new Date();
      await notificationDoc.save();
    } else {
      notificationDoc.status = "FAILED";
      notificationDoc.failureReason =
        sendResult.error ?? "Failed to send notification during retry.";
      notificationDoc.retryCount += 1;
      await notificationDoc.save();
    }

    return this.toResponse(notificationDoc);
  }

  public async getHistory(
    userId: string,
    userRole: string,
    query: NotificationHistoryQueryDto = {},
  ): Promise<{
    notifications: NotificationResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const targetUserId =
      userRole === "admin" ? (query.type ? undefined : undefined) : toObjectId(userId);

    const filterUserId = userRole === "admin" ? undefined : targetUserId;

    const result = await this.notificationRepository.findHistory(
      filterUserId,
      query,
    );

    return {
      notifications: result.items.map((item) => this.toResponse(item)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  public async getNotificationById(
    userId: string,
    userRole: string,
    id: string,
  ): Promise<NotificationResponse> {
    const notificationObjId = toObjectId(id);
    const notificationDoc = await this.notificationRepository.findById(
      notificationObjId,
    );

    if (!notificationDoc) {
      throw new AppError(
        "Notification not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (
      userRole !== "admin" &&
      notificationDoc.userId?.toString() !== userId &&
      notificationDoc.recipient !== userId
    ) {
      throw new AppError(
        "You are not authorized to view this notification.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    return this.toResponse(notificationDoc);
  }

  private toResponse(
    notification: HydratedDocument<Notification>,
  ): NotificationResponse {
    return {
      id: notification._id.toString(),
      ...(notification.userId ? { userId: notification.userId.toString() } : {}),
      type: notification.type,
      provider: notification.provider,
      template: notification.template,
      subject: notification.subject,
      recipient: notification.recipient,
      status: notification.status,
      payload: notification.payload,
      retryCount: notification.retryCount,
      ...(notification.failureReason
        ? { failureReason: notification.failureReason }
        : {}),
      ...(notification.sentAt ? { sentAt: notification.sentAt } : {}),
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
