export interface CreateAuditLogDto {
  actorId: string;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateActivityLogDto {
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface QueryPlatformLogsDto {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}
