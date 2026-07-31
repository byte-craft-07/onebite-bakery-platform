import type { FilterQuery, HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import type { QueryPlatformLogsDto } from "../dto/index.js";
import { AuditLogModel, type AuditLog } from "../model/index.js";

export class AuditRepository extends BaseRepository<AuditLog> {
  public constructor() {
    super(AuditLogModel);
  }

  public async findAuditLogs(
    query: QueryPlatformLogsDto = {},
  ): Promise<{
    items: Array<HydratedDocument<AuditLog>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<AuditLog> = {};
    if (query.action) filter.action = query.action;
    if (query.entity) filter.entity = query.entity;
    if (query.userId) filter.actorId = query.userId;

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const [items, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      AuditLogModel.countDocuments(filter).exec(),
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
