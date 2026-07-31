import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { NotificationController } from "../controller/index.js";
import { NotificationRepository } from "../repository/index.js";
import { NotificationService } from "../service/index.js";
import {
  notificationIdParamSchema,
  sendNotificationSchema,
} from "../validators/index.js";

export const notificationRouter = Router();

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

notificationRouter.post(
  "/send",
  requireAuth,
  requireRoles(["admin"]),
  validateRequest({ body: sendNotificationSchema }),
  asyncHandler(notificationController.send),
);

notificationRouter.get(
  "/history",
  requireAuth,
  asyncHandler(notificationController.getHistory),
);

notificationRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: notificationIdParamSchema }),
  asyncHandler(notificationController.getNotificationById),
);

notificationRouter.post(
  "/:id/retry",
  requireAuth,
  requireRoles(["admin"]),
  validateRequest({ params: notificationIdParamSchema }),
  asyncHandler(notificationController.retryNotification),
);
