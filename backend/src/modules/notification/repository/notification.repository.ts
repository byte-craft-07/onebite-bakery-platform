import type { FilterQuery, HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import type { NotificationStatus } from "../constants/index.js";
import type { NotificationHistoryQueryDto } from "../dto/index.js";
import { NotificationModel, type Notification } from "../model/index.js";

export class NotificationRepository extends BaseRepository<Notification> {
  public constructor() {
    super(NotificationModel);
  }

  public async findHistory(
    userId?: Types.ObjectId,
    query: NotificationHistoryQueryDto = {},
  ): Promise<{
    items: Array<HydratedDocument<Notification>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Notification> = {};
    if (userId) filter.userId = userId;
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.isRead !== undefined) filter.isRead = query.isRead;

    const [items, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      NotificationModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async getUnreadCount(userId?: Types.ObjectId): Promise<number> {
    const filter: FilterQuery<Notification> = { isRead: false };
    if (userId) filter.userId = userId;
    return NotificationModel.countDocuments(filter).exec();
  }

  public async markAsRead(
    id: Types.ObjectId,
    userId?: Types.ObjectId,
  ): Promise<HydratedDocument<Notification> | null> {
    const filter: FilterQuery<Notification> = { _id: id };
    if (userId) filter.userId = userId;

    return NotificationModel.findOneAndUpdate(
      filter,
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    ).exec();
  }

  public async markAllAsRead(userId?: Types.ObjectId): Promise<number> {
    const filter: FilterQuery<Notification> = { isRead: false };
    if (userId) filter.userId = userId;

    const result = await NotificationModel.updateMany(
      filter,
      { $set: { isRead: true, readAt: new Date() } },
    ).exec();

    return result.modifiedCount;
  }

  public async updateStatus(
    id: Types.ObjectId,
    status: NotificationStatus,
    extra: { failureReason?: string; sentAt?: Date } = {},
  ): Promise<HydratedDocument<Notification> | null> {
    return NotificationModel.findByIdAndUpdate(
      id,
      { $set: { status, ...extra } },
      { new: true },
    ).exec();
  }

  public async incrementRetry(
    id: Types.ObjectId,
    failureReason: string,
  ): Promise<HydratedDocument<Notification> | null> {
    return NotificationModel.findByIdAndUpdate(
      id,
      {
        $inc: { retryCount: 1 },
        $set: { status: "FAILED", failureReason },
      },
      { new: true },
    ).exec();
  }
}
