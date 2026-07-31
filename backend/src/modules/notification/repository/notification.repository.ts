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
