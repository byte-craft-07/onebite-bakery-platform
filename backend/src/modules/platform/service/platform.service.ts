import type { HydratedDocument } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import type {
  CreateActivityLogDto,
  CreateAuditLogDto,
  QueryPlatformLogsDto,
} from "../dto/index.js";
import {
  type ActivityLog,
  type AuditLog,
} from "../model/index.js";
import type {
  ActivityRepository,
  AuditRepository,
  PlatformRepository,
} from "../repository/index.js";
import type {
  HealthStatusResponse,
  PlatformMetricsResponse,
} from "../types/index.js";

export class PlatformService {
  public constructor(
    private readonly platformRepository: PlatformRepository,
    private readonly auditRepository: AuditRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  public async getHealth(): Promise<HealthStatusResponse> {
    const isDbConnected = this.platformRepository.isDatabaseConnected();

    return {
      status: isDbConnected ? "ok" : "unhealthy",
      database: isDbConnected ? "connected" : "disconnected",
      environment: process.env.NODE_ENV ?? "development",
      version: "1.0.0",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  public getLiveness(): { status: string; uptimeSeconds: number } {
    return {
      status: "live",
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  public getReadiness(): { status: string; database: string } {
    const isDbConnected = this.platformRepository.isDatabaseConnected();

    return {
      status: isDbConnected ? "ready" : "not_ready",
      database: isDbConnected ? "connected" : "disconnected",
    };
  }

  public async getMetrics(): Promise<PlatformMetricsResponse> {
    const metrics = await this.platformRepository.getSystemMetrics();

    return {
      totalUsers: metrics.totalUsers,
      totalProducts: metrics.totalProducts,
      totalOrders: metrics.totalOrders,
      totalRevenue: metrics.totalRevenue,
      databaseLatencyMs: metrics.databaseLatencyMs,
      apiUptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? "development",
    };
  }

  public async logAudit(dto: CreateAuditLogDto): Promise<HydratedDocument<AuditLog>> {
    return this.auditRepository.create({
      actorId: toObjectId(dto.actorId),
      ...(dto.actorEmail ? { actorEmail: dto.actorEmail } : {}),
      action: dto.action,
      entity: dto.entity,
      ...(dto.entityId ? { entityId: dto.entityId } : {}),
      timestamp: new Date(),
      ...(dto.metadata ? { metadata: dto.metadata } : {}),
    });
  }

  public async logActivity(
    dto: CreateActivityLogDto,
  ): Promise<HydratedDocument<ActivityLog>> {
    return this.activityRepository.create({
      userId: toObjectId(dto.userId),
      action: dto.action,
      ...(dto.ipAddress ? { ipAddress: dto.ipAddress } : {}),
      ...(dto.userAgent ? { userAgent: dto.userAgent } : {}),
      timestamp: new Date(),
      ...(dto.metadata ? { metadata: dto.metadata } : {}),
    });
  }

  public async getAuditLogs(query: QueryPlatformLogsDto) {
    return this.auditRepository.findAuditLogs(query);
  }

  public async getActivityLogs(query: QueryPlatformLogsDto) {
    return this.activityRepository.findActivityLogs(query);
  }
}
