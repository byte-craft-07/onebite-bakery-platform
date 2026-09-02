import { Router, type Request } from "express";

import { requireAuth } from "../../auth/middlewares/require-auth.middleware.js";
import { requireDeliveryAgent } from "../../auth/middlewares/branch-auth.middleware.js";
import { OrderService } from "../../order/service/order.service.js";
import { OrderRepository } from "../../order/repository/order.repository.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";

export const deliveryAgentRouter = Router();

const orderService = new OrderService(new OrderRepository());

// All routes require authenticated user with delivery_agent (or admin) role
deliveryAgentRouter.use(requireAuth, requireDeliveryAgent);

// GET /delivery-agent/dashboard
deliveryAgentRouter.get(
  "/dashboard",
  asyncHandler(async (req: Request, res) => {
    const user = (req as unknown as { user: { id: string; branchId?: string } }).user;
    const stats = await orderService.getDeliveryAgentDashboard(user.id, user.branchId);

    res.json({
      success: true,
      message: "Delivery agent dashboard stats fetched successfully.",
      data: stats,
    });
  }),
);

// GET /delivery-agent/orders
deliveryAgentRouter.get(
  "/orders",
  asyncHandler(async (req: Request, res) => {
    const user = (req as unknown as { user: { id: string; branchId?: string } }).user;
    const { status } = req.query;

    const orders = await orderService.getDeliveryAgentOrders(
      user.id,
      typeof status === "string" ? status : undefined,
      user.branchId,
    );

    res.json({
      success: true,
      message: "Delivery agent orders fetched successfully.",
      data: { orders },
    });
  }),
);

// GET /delivery-agent/orders/:orderId
deliveryAgentRouter.get(
  "/orders/:orderId",
  asyncHandler(async (req: Request, res) => {
    const user = (req as unknown as { user: { id: string; role: string; branchId?: string } }).user;
    const orderId = typeof req.params.orderId === "string" ? req.params.orderId : "";

    const order = await orderService.getDeliveryAgentOrderById(
      user.id,
      orderId,
      user.branchId,
      user.role,
    );

    res.json({
      success: true,
      message: "Delivery agent order details fetched successfully.",
      data: { order },
    });
  }),
);

// POST /delivery-agent/orders/:orderId/start
deliveryAgentRouter.post(
  "/orders/:orderId/start",
  asyncHandler(async (req: Request, res) => {
    const user = (req as unknown as { user: { id: string; role: string; branchId?: string } }).user;
    const orderId = typeof req.params.orderId === "string" ? req.params.orderId : "";

    const updatedOrder = await orderService.startDelivery(
      user.id,
      orderId,
      user.branchId,
      user.role,
    );

    res.json({
      success: true,
      message: "Delivery started successfully.",
      data: { order: updatedOrder },
    });
  }),
);

// POST /delivery-agent/orders/:orderId/complete
deliveryAgentRouter.post(
  "/orders/:orderId/complete",
  asyncHandler(async (req: Request, res) => {
    const user = (req as unknown as { user: { id: string; role: string; branchId?: string } }).user;
    const orderId = typeof req.params.orderId === "string" ? req.params.orderId : "";

    const updatedOrder = await orderService.completeDelivery(
      user.id,
      orderId,
      user.branchId,
      user.role,
    );

    res.json({
      success: true,
      message: "Delivery marked as complete.",
      data: { order: updatedOrder },
    });
  }),
);
