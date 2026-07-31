import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
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
const orderService = new OrderService(orderRepository);
const orderController = new OrderController(orderService);
const ownerOnly = [requireAuth, requireRoles(["admin"])] as const;

orderRouter.post(
  "/",
  requireAuth,
  validateRequest({ body: createOrderSchema }),
  asyncHandler(orderController.create),
);

orderRouter.get("/", requireAuth, asyncHandler(orderController.listCustomerOrders));

orderRouter.get(
  "/admin/orders",
  ...ownerOnly,
  validateRequest({ query: listOrdersQuerySchema }),
  asyncHandler(orderController.adminListOrders),
);

orderRouter.get(
  "/admin/orders/:id",
  ...ownerOnly,
  validateRequest({ params: orderIdParamSchema }),
  asyncHandler(orderController.adminGetOrder),
);

orderRouter.patch(
  "/admin/orders/:id/status",
  ...ownerOnly,
  validateRequest({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  asyncHandler(orderController.adminUpdateStatus),
);

orderRouter.patch(
  "/admin/orders/:id/ready-time",
  ...ownerOnly,
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
