import type { FilterQuery, HydratedDocument } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import type { QueryPlatformLogsDto } from "../dto/index.js";
import { ActivityLogModel, type ActivityLog } from "../model/index.js";

export class ActivityRepository extends BaseRepository<ActivityLog> {
  public constructor() {
    super(ActivityLogModel);
  }

  public async findActivityLogs(
    query: QueryPlatformLogsDto = {},
  ): Promise<{
    items: Array<HydratedDocument<ActivityLog>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ActivityLog> = {};
    if (query.action) filter.action = query.action;
    if (query.userId) filter.userId = query.userId;

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const [items, total] = await Promise.all([
      ActivityLogModel.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ActivityLogModel.countDocuments(filter).exec(),
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
}
