import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import {
  NotificationRepository,
  NotificationService,
  OrderNotificationService,
} from "../../notification/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { OrderController } from "../controller/index.js";
import { OrderRepository } from "../repository/index.js";
import { OrderService } from "../service/index.js";
import {
  cancelOrderSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
  updateReadyTimeSchema,
} from "../validators/index.js";

export const orderRouter = Router();

const orderRepository = new OrderRepository();
const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const orderNotificationService = new OrderNotificationService(notificationService);
const orderService = new OrderService(
  orderRepository,
  undefined,
  orderNotificationService,
);
const orderController = new OrderController(orderService);
const ownerOnly = [requireAuth, requireRoles(["admin"])] as const;
const staffOrAdmin = [requireAuth, requireRoles(["admin", "branch_admin"])] as const;

orderRouter.post(
  "/",
  requireAuth,
  validateRequest({ body: createOrderSchema }),
  asyncHandler(orderController.create),
);

orderRouter.get("/", requireAuth, asyncHandler(orderController.listCustomerOrders));

orderRouter.get(
  "/admin/orders",
  ...staffOrAdmin,
  validateRequest({ query: listOrdersQuerySchema }),
  asyncHandler(orderController.adminListOrders),
);

orderRouter.get(
  "/admin/orders/:id",
  ...staffOrAdmin,
  validateRequest({ params: orderIdParamSchema }),
  asyncHandler(orderController.adminGetOrder),
);

orderRouter.patch(
  "/admin/orders/:id/status",
  ...staffOrAdmin,
  validateRequest({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  asyncHandler(orderController.adminUpdateStatus),
);

orderRouter.patch(
  "/:id/status",
  ...staffOrAdmin,
  validateRequest({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  asyncHandler(orderController.adminUpdateStatus),
);

orderRouter.patch(
  "/admin/orders/:id/ready-time",
  ...staffOrAdmin,
  validateRequest({ params: orderIdParamSchema, body: updateReadyTimeSchema }),
  asyncHandler(orderController.adminUpdateReadyTime),
);

orderRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: orderIdParamSchema }),
  asyncHandler(orderController.getCustomerOrder),
);

orderRouter.post(
  "/:id/cancel",
  requireAuth,
  validateRequest({ params: orderIdParamSchema, body: cancelOrderSchema }),
  asyncHandler(orderController.cancelCustomerOrder),
);

orderRouter.post(
  "/:id/reorder",
  requireAuth,
  validateRequest({ params: orderIdParamSchema }),
  asyncHandler(orderController.reorder),
);
