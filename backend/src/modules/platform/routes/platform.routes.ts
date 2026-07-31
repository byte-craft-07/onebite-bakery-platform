import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { PlatformController } from "../controller/index.js";
import {
  ActivityRepository,
  AuditRepository,
  PlatformRepository,
} from "../repository/index.js";
import { PlatformService } from "../service/index.js";
import { platformLogsQuerySchema } from "../validators/index.js";

export const platformRouter = Router();
export const platformHealthRouter = Router();

const platformRepository = new PlatformRepository();
const auditRepository = new AuditRepository();
const activityRepository = new ActivityRepository();
const platformService = new PlatformService(
  platformRepository,
  auditRepository,
  activityRepository,
);
const platformController = new PlatformController(platformService);

// Public Health Endpoints
platformHealthRouter.get("/", asyncHandler(platformController.getHealth));
platformHealthRouter.get("/live", asyncHandler(platformController.getLiveness));
platformHealthRouter.get("/ready", asyncHandler(platformController.getReadiness));

// Admin Platform Endpoints
platformRouter.get(
  "/metrics",
  requireAuth,
  requireRoles(["admin"]),
  asyncHandler(platformController.getMetrics),
);

platformRouter.get(
  "/audit",
  requireAuth,
  requireRoles(["admin"]),
  validateRequest({ query: platformLogsQuerySchema }),
  asyncHandler(platformController.getAuditLogs),
);

platformRouter.get(
  "/activity",
  requireAuth,
  requireRoles(["admin"]),
  validateRequest({ query: platformLogsQuerySchema }),
  asyncHandler(platformController.getActivityLogs),
);
