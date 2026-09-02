import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { toObjectId } from "../../../db/utils/object-id.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import {
  requireAuth,
  requireBranchAdmin,
  requireBranchScope,
  requireCentralAdmin,
} from "../../auth/index.js";
import { BranchController } from "../controller/branch.controller.js";
import {
  assignBranchAdminDtoSchema,
  assignServiceAreaDtoSchema,
  createBranchDtoSchema,
  updateBranchDtoSchema,
  updateBranchProductDtoSchema,
  updateBranchStatusDtoSchema,
} from "../dto/branch.dto.js";
import { BranchRepository } from "../repository/branch.repository.js";
import { BranchService } from "../service/branch.service.js";

const branchRepository = new BranchRepository();
const branchService = new BranchService(branchRepository);
const branchController = new BranchController(branchService);

export const branchRouter = Router();

const branchIdParamSchema = z.object({
  branchId: z.string().refine((val) => Types.ObjectId.isValid(val), "Invalid branch id."),
});

const serviceAreaParamSchema = z.object({
  branchId: z.string().refine((val) => Types.ObjectId.isValid(val), "Invalid branch id."),
  serviceAreaId: z.string().min(1, "Invalid service area id."),
});

const branchProductParamSchema = z.object({
  branchId: z.string().refine((val) => Types.ObjectId.isValid(val), "Invalid branch id."),
  productId: z.string().refine((val) => Types.ObjectId.isValid(val), "Invalid product id."),
});

// All branch management operations require authentication
branchRouter.use(requireAuth);

// Central Admin: Create new branch
branchRouter.post(
  "/",
  requireCentralAdmin,
  validateRequest({ body: createBranchDtoSchema }),
  asyncHandler(branchController.createBranch),
);

// Central Admin: List all branches
branchRouter.get(
  "/",
  requireCentralAdmin,
  asyncHandler(branchController.getAllBranches),
);

// Central Admin: Get branch product availability matrix
branchRouter.get(
  "/matrix",
  requireCentralAdmin,
  asyncHandler(branchController.getBranchProductMatrix),
);

// Central Admin or Scoped Branch Admin: Get branch details
branchRouter.get(
  "/:branchId",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: branchIdParamSchema }),
  asyncHandler(branchController.getBranchById),
);

// Central Admin: Update branch profile
branchRouter.patch(
  "/:branchId",
  requireCentralAdmin,
  validateRequest({ params: branchIdParamSchema, body: updateBranchDtoSchema }),
  asyncHandler(branchController.updateBranch),
);

// Central Admin: Activate or deactivate branch
branchRouter.patch(
  "/:branchId/status",
  requireCentralAdmin,
  validateRequest({ params: branchIdParamSchema, body: updateBranchStatusDtoSchema }),
  asyncHandler(branchController.updateBranchStatus),
);

// Central Admin / Branch Admin: Assign village / service area to branch
branchRouter.post(
  "/:branchId/service-areas",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: branchIdParamSchema, body: assignServiceAreaDtoSchema }),
  asyncHandler(branchController.assignServiceArea),
);

// Central Admin / Branch Admin: Unassign village / service area from branch
branchRouter.delete(
  "/:branchId/service-areas/:serviceAreaId",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: serviceAreaParamSchema }),
  asyncHandler(branchController.unassignServiceArea),
);

// Central Admin or Scoped Branch Admin: List assigned villages
branchRouter.get(
  "/:branchId/service-areas",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: branchIdParamSchema }),
  asyncHandler(branchController.listServiceAreas),
);

// Central Admin: Assign user as Branch Admin
branchRouter.post(
  "/:branchId/assign-admin",
  requireCentralAdmin,
  validateRequest({ params: branchIdParamSchema, body: assignBranchAdminDtoSchema }),
  asyncHandler(branchController.assignBranchAdmin),
);

// Central Admin: Remove Branch Admin assignment
branchRouter.post(
  "/:branchId/remove-admin",
  requireCentralAdmin,
  validateRequest({ params: branchIdParamSchema, body: assignBranchAdminDtoSchema }),
  asyncHandler(branchController.removeBranchAdmin),
);

// Central Admin or Scoped Branch Admin: List branch products & availability
branchRouter.get(
  "/:branchId/products",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: branchIdParamSchema }),
  asyncHandler(branchController.getBranchProducts),
);

// Central Admin or Scoped Branch Admin: Update branch product availability & stock
branchRouter.patch(
  "/:branchId/products/:productId",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: branchProductParamSchema, body: updateBranchProductDtoSchema }),
  asyncHandler(branchController.updateBranchProduct),
);

// Central Admin or Scoped Branch Admin: Branch dashboard stats
branchRouter.get(
  "/:branchId/dashboard",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: branchIdParamSchema }),
  asyncHandler(branchController.getBranchDashboardStats),
);

// Central Admin or Scoped Branch Admin: List branch orders
branchRouter.get(
  "/:branchId/orders",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: branchIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { OrderModel } = await import("../../order/model/order.model.js");
    const branchId = typeof req.params.branchId === "string" ? req.params.branchId : "";
    const { status } = req.query;

    const filter: Record<string, unknown> = { branchId: toObjectId(branchId) };
    if (status && typeof status === "string" && status !== "ALL") {
      filter.orderStatus = status;
    }

    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();

    res.json({
      success: true,
      message: "Branch orders fetched successfully.",
      data: { orders },
    });
  }),
);

// Central Admin or Scoped Branch Admin: List branch delivery agents
branchRouter.get(
  "/:branchId/delivery-agents",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  validateRequest({ params: branchIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { UserModel } = await import("../../user/model/user.model.js");
    const branchId = typeof req.params.branchId === "string" ? req.params.branchId : "";

    const agents = await UserModel.find({
      branchId: toObjectId(branchId),
      role: "delivery_agent",
      status: "active",
    })
      .select("_id name phone email status")
      .exec();

    res.json({
      success: true,
      message: "Branch delivery agents fetched successfully.",
      data: {
        agents: agents.map((a) => ({
          id: a._id.toString(),
          name: a.name,
          phone: a.phone,
          email: a.email,
          status: a.status,
        })),
      },
    });
  }),
);

// Central Admin or Scoped Branch Admin: Assign delivery agent to order
branchRouter.post(
  "/:branchId/orders/:orderId/assign-delivery",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  asyncHandler(async (req, res) => {
    const { OrderService } = await import("../../order/service/order.service.js");
    const { OrderRepository } = await import("../../order/repository/order.repository.js");
    const orderService = new OrderService(new OrderRepository());

    const branchId = typeof req.params.branchId === "string" ? req.params.branchId : "";
    const orderId = typeof req.params.orderId === "string" ? req.params.orderId : "";
    const { deliveryAgentId } = req.body;

    const updatedOrder = await orderService.assignDeliveryAgent(
      branchId,
      orderId,
      deliveryAgentId,
      (req as unknown as { user?: { id?: string } }).user?.id,
    );

    res.json({
      success: true,
      message: "Delivery agent assigned successfully.",
      data: { order: updatedOrder },
    });
  }),
);

// Central Admin or Scoped Branch Admin: Unassign delivery agent from order
branchRouter.post(
  "/:branchId/orders/:orderId/unassign-delivery",
  requireBranchAdmin,
  requireBranchScope((req) => (typeof req.params.branchId === "string" ? req.params.branchId : undefined)),
  asyncHandler(async (req, res) => {
    const { OrderService } = await import("../../order/service/order.service.js");
    const { OrderRepository } = await import("../../order/repository/order.repository.js");
    const orderService = new OrderService(new OrderRepository());

    const branchId = typeof req.params.branchId === "string" ? req.params.branchId : "";
    const orderId = typeof req.params.orderId === "string" ? req.params.orderId : "";

    const updatedOrder = await orderService.unassignDeliveryAgent(
      branchId,
      orderId,
      (req as unknown as { user?: { id?: string } }).user?.id,
    );

    res.json({
      success: true,
      message: "Delivery agent unassigned successfully.",
      data: { order: updatedOrder },
    });
  }),
);
