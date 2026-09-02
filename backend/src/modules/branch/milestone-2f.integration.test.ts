import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BranchModel } from "./model/branch.model.js";
import { BranchProductModel } from "./model/branch-product.model.js";
import { BranchService } from "./service/branch.service.js";
import type { BranchRepository } from "./repository/branch.repository.js";
import { OrderModel } from "../order/model/order.model.js";
import { OrderService } from "../order/service/order.service.js";
import type { OrderRepository } from "../order/repository/order.repository.js";
import { UserModel } from "../user/model/user.model.js";
import { AppError } from "../../shared/errors/app-error.js";
import { AuditLogModel } from "../platform/model/audit-log.model.js";

describe("Milestone 2F — Branch Fulfillment, Delivery Operations & Order Lifecycle Security", () => {
  const branchAId = new Types.ObjectId();
  const branchBId = new Types.ObjectId();

  const customerId = new Types.ObjectId();
  const otherCustomerId = new Types.ObjectId();

  const agentBranchAId = new Types.ObjectId();
  const agentBranchBId = new Types.ObjectId();

  const orderAId = new Types.ObjectId();

  const branchADoc = {
    _id: branchAId,
    name: "Kanpur Branch",
    code: "KANPUR",
    type: "MAIN" as const,
    isActive: true,
  };

  const branchBDoc = {
    _id: branchBId,
    name: "Banda Branch",
    code: "BANDA",
    type: "FRANCHISE" as const,
    isActive: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as never);
  });

  it("1. Order Lifecycle State Machine: Valid transitions succeed, invalid transitions are rejected", async () => {
    const mockOrderDoc = {
      _id: orderAId,
      orderNumber: "ORD-101",
      customerId,
      branchId: branchAId,
      deliveryMethod: "HOME_DELIVERY" as const,
      orderStatus: "PENDING" as const,
      deliveryAgentId: agentBranchAId,
    };

    const mockOrderRepo: Partial<OrderRepository> = {
      findById: vi.fn().mockResolvedValue(mockOrderDoc as never),
      updateStatus: vi.fn().mockResolvedValue({ ...mockOrderDoc, orderStatus: "CONFIRMED" } as never),
    };

    const orderService = new OrderService(mockOrderRepo as OrderRepository);

    // Valid transition: PENDING -> CONFIRMED
    const updated = await orderService.adminUpdateOrderStatus(
      orderAId.toString(),
      { status: "CONFIRMED" },
      { userId: customerId.toString(), role: "admin" } as never,
    );

    expect(updated.orderStatus).toBe("CONFIRMED");

    // Invalid transition: DELIVERED -> PREPARING
    vi.spyOn(mockOrderRepo, "findById").mockResolvedValue({
      ...mockOrderDoc,
      orderStatus: "DELIVERED",
    } as never);

    await expect(
      orderService.adminUpdateOrderStatus(
        orderAId.toString(),
        { status: "PREPARING" },
        { userId: customerId.toString(), role: "admin" } as never,
      ),
    ).rejects.toThrow(AppError);
  });

  it("2. Delivery Requirement for OUT_FOR_DELIVERY: Succeeds smoothly without requiring separate delivery agent", async () => {
    const mockOrderUnassigned = {
      _id: orderAId,
      orderNumber: "ORD-102",
      customerId,
      branchId: branchAId,
      deliveryMethod: "HOME_DELIVERY" as const,
      orderStatus: "PREPARING" as const,
      deliveryAgentId: undefined,
    };

    const mockOrderRepo: Partial<OrderRepository> = {
      findById: vi.fn().mockResolvedValue(mockOrderUnassigned as never),
      updateStatus: vi.fn().mockResolvedValue({
        ...mockOrderUnassigned,
        orderStatus: "OUT_FOR_DELIVERY",
      } as never),
    };

    const orderService = new OrderService(mockOrderRepo as OrderRepository);

    const result = await orderService.adminUpdateOrderStatus(
      orderAId.toString(),
      { status: "OUT_FOR_DELIVERY" },
      { userId: customerId.toString(), role: "admin" } as never,
    );

    expect(result.orderStatus).toBe("OUT_FOR_DELIVERY");
  });

  it("3. Delivery Assignment Isolation: Assigns agent from same branch, rejects cross-branch agent or pickup order", async () => {
    const mockOrderHome = {
      _id: orderAId,
      orderNumber: "ORD-103",
      customerId,
      branchId: branchAId,
      deliveryMethod: "HOME_DELIVERY" as const,
      orderStatus: "CONFIRMED" as const,
      save: vi.fn().mockResolvedValue({}),
    };

    const mockAgentSameBranch = {
      _id: agentBranchAId,
      name: "Rider Alpha",
      phone: "9876543210",
      role: "delivery_agent",
      branchId: branchAId,
      status: "active",
    };

    const mockAgentDiffBranch = {
      _id: agentBranchBId,
      name: "Rider Beta",
      phone: "9876543211",
      role: "delivery_agent",
      branchId: branchBId,
      status: "active",
    };

    const mockOrderRepo: Partial<OrderRepository> = {
      findById: vi.fn().mockResolvedValue(mockOrderHome as never),
    };

    vi.spyOn(UserModel, "findById").mockImplementation((id: unknown) => {
      if (String(id) === agentBranchAId.toString()) {
        return { exec: vi.fn().mockResolvedValue(mockAgentSameBranch) } as never;
      }
      if (String(id) === agentBranchBId.toString()) {
        return { exec: vi.fn().mockResolvedValue(mockAgentDiffBranch) } as never;
      }
      return { exec: vi.fn().mockResolvedValue(null) } as never;
    });

    const orderService = new OrderService(mockOrderRepo as OrderRepository);

    // Assigning agent from same branch -> succeeds
    const assigned = await orderService.assignDeliveryAgent(
      branchAId.toString(),
      orderAId.toString(),
      agentBranchAId.toString(),
      customerId.toString(),
    );

    expect(assigned.deliveryAgentId).toBe(agentBranchAId.toString());

    // Assigning agent from another branch -> rejected 403
    await expect(
      orderService.assignDeliveryAgent(
        branchAId.toString(),
        orderAId.toString(),
        agentBranchBId.toString(),
        customerId.toString(),
      ),
    ).rejects.toThrow("Delivery agent does not belong to this branch.");

    // Store pickup order -> rejected 422
    vi.spyOn(mockOrderRepo, "findById").mockResolvedValue({
      ...mockOrderHome,
      deliveryMethod: "STORE_PICKUP",
    } as never);

    await expect(
      orderService.assignDeliveryAgent(
        branchAId.toString(),
        orderAId.toString(),
        agentBranchAId.toString(),
        customerId.toString(),
      ),
    ).rejects.toThrow("Delivery agent cannot be assigned to store pickup orders.");
  });

  it("4. Customer & Branch Isolation: Customer viewing another customer's order or Branch Admin accessing wrong branch is rejected", async () => {
    const mockOrderDoc = {
      _id: orderAId,
      customerId,
      branchId: branchAId,
      deliveryMethod: "HOME_DELIVERY" as const,
      orderStatus: "CONFIRMED" as const,
    };

    const mockOrderRepo: Partial<OrderRepository> = {
      findById: vi.fn().mockResolvedValue(mockOrderDoc as never),
    };

    const orderService = new OrderService(mockOrderRepo as OrderRepository);

    // Customer viewing own order -> allowed
    const ownOrder = await orderService.getOrderByIdForActor(orderAId.toString(), {
      id: customerId.toString(),
      role: "customer",
    });
    expect(ownOrder.id).toBe(orderAId.toString());

    // Customer viewing another customer's order -> rejected 403
    await expect(
      orderService.getOrderByIdForActor(orderAId.toString(), {
        id: otherCustomerId.toString(),
        role: "customer",
      }),
    ).rejects.toThrow("Access denied: You are not authorized to view this order.");

    // Branch Admin accessing another branch's order -> rejected 403
    await expect(
      orderService.getOrderByIdForActor(orderAId.toString(), {
        id: new Types.ObjectId().toString(),
        role: "branch_admin",
        branchId: branchBId.toString(),
      }),
    ).rejects.toThrow("Access denied: Order does not belong to your assigned branch.");
  });
});
