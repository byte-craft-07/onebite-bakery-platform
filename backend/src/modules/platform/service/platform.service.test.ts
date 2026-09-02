import { Types, type HydratedDocument } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InMemoryBackgroundJobRunner } from "../jobs/index.js";
import { type ActivityLog, type AuditLog } from "../model/index.js";
import type {
  ActivityRepository,
  AuditRepository,
  PlatformRepository,
} from "../repository/index.js";
import { InMemoryScheduler } from "../scheduler/index.js";
import { PlatformService } from "./platform.service.js";

const adminId = new Types.ObjectId().toString();
const customerId = new Types.ObjectId().toString();

const createMockAuditLogDoc = (
  overrides: Partial<AuditLog> = {},
): HydratedDocument<AuditLog> => {
  const log = {
    _id: new Types.ObjectId(),
    actorId: new Types.ObjectId(adminId),
    actorEmail: "admin@theonlinebakery.test",
    action: "PRODUCT_UPDATE",
    entity: "PRODUCT",
    entityId: "prod_123",
    timestamp: new Date(),
    metadata: { change: "Price updated" },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  return log as unknown as HydratedDocument<AuditLog>;
};

const createMockActivityLogDoc = (
  overrides: Partial<ActivityLog> = {},
): HydratedDocument<ActivityLog> => {
  const log = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(customerId),
    action: "ORDER_CREATED",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    timestamp: new Date(),
    metadata: { orderId: "ord_123" },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  return log as unknown as HydratedDocument<ActivityLog>;
};

const createService = () => {
  const platformRepository = {
    getSystemMetrics: vi.fn().mockResolvedValue({
      totalUsers: 10,
      totalProducts: 25,
      totalOrders: 5,
      totalRevenue: 2500,
      databaseLatencyMs: 2,
    }),
    isDatabaseConnected: vi.fn().mockReturnValue(true),
  } as unknown as PlatformRepository;

  const auditRepository = {
    create: vi
      .fn()
      .mockImplementation((data: Partial<AuditLog>) =>
        Promise.resolve(createMockAuditLogDoc(data)),
      ),
    findAuditLogs: vi.fn().mockResolvedValue({
      items: [createMockAuditLogDoc()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
  } as unknown as AuditRepository;

  const activityRepository = {
    create: vi
      .fn()
      .mockImplementation((data: Partial<ActivityLog>) =>
        Promise.resolve(createMockActivityLogDoc(data)),
      ),
    findActivityLogs: vi.fn().mockResolvedValue({
      items: [createMockActivityLogDoc()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
  } as unknown as ActivityRepository;

  return {
    service: new PlatformService(
      platformRepository,
      auditRepository,
      activityRepository,
    ),
    platformRepository,
    auditRepository,
    activityRepository,
  };
};

describe("PlatformService, Jobs & Scheduler Foundation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns health, liveness, and readiness probes correctly", async () => {
    const { service } = createService();

    const health = await service.getHealth();
    expect(health.status).toBe("ok");
    expect(health.database).toBe("connected");

    const live = service.getLiveness();
    expect(live.status).toBe("live");

    const ready = service.getReadiness();
    expect(ready.status).toBe("ready");
    expect(ready.database).toBe("connected");
  });

  it("returns platform metrics aggregated from system repositories", async () => {
    const { service } = createService();

    const metrics = await service.getMetrics();

    expect(metrics.totalUsers).toBe(10);
    expect(metrics.totalProducts).toBe(25);
    expect(metrics.totalOrders).toBe(5);
    expect(metrics.totalRevenue).toBe(2500);
    expect(metrics.databaseLatencyMs).toBe(2);
    expect(metrics.nodeVersion).toBe(process.version);
  });

  it("logs audit events for administrative actions and queries history", async () => {
    const { service, auditRepository } = createService();

    const log = await service.logAudit({
      actorId: adminId,
      actorEmail: "admin@theonlinebakery.test",
      action: "PRODUCT_UPDATE",
      entity: "PRODUCT",
      entityId: "prod_123",
    });

    expect(log.action).toBe("PRODUCT_UPDATE");
    expect(auditRepository.create).toHaveBeenCalledOnce();

    const history = await service.getAuditLogs({ page: 1 });
    expect(history.items).toHaveLength(1);
  });

  it("logs customer activity events and queries activity history", async () => {
    const { service, activityRepository } = createService();

    const log = await service.logActivity({
      userId: customerId,
      action: "ORDER_CREATED",
      ipAddress: "127.0.0.1",
    });

    expect(log.action).toBe("ORDER_CREATED");
    expect(activityRepository.create).toHaveBeenCalledOnce();

    const history = await service.getActivityLogs({ page: 1 });
    expect(history.items).toHaveLength(1);
  });

  it("tests background job runner foundation (registering & executing background jobs)", async () => {
    const runner = new InMemoryBackgroundJobRunner();
    const mockJobHandler = vi.fn().mockResolvedValue(undefined);

    runner.registerJob("PAYMENT_RETRY", mockJobHandler);
    const result = await runner.runJob("PAYMENT_RETRY", { paymentId: "pay_123" });

    expect(result.status).toBe("completed");
    expect(mockJobHandler).toHaveBeenCalledWith({ paymentId: "pay_123" });

    const status = await runner.getJobStatus(result.jobId);
    expect(status).toBe("completed");
  });

  it("tests scheduler foundation (scheduling & canceling cron jobs)", () => {
    const scheduler = new InMemoryScheduler();
    const mockHandler = vi.fn().mockResolvedValue(undefined);

    const { scheduleId } = scheduler.scheduleJob("CLEANUP_EXPIRED_CARTS", "0 0 * * *", mockHandler);
    expect(scheduleId).toBeDefined();

    const jobs = scheduler.getScheduledJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.name).toBe("CLEANUP_EXPIRED_CARTS");

    const cancelled = scheduler.cancelJob(scheduleId);
    expect(cancelled).toBe(true);
    expect(scheduler.getScheduledJobs()).toHaveLength(0);
  });
});
