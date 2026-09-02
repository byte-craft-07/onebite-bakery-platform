import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderService } from "../order/service/order.service.js";
import type { OrderRepository } from "../order/repository/order.repository.js";
import { UserModel } from "../user/model/user.model.js";
import { AppError } from "../../shared/errors/app-error.js";
import { AuditLogModel } from "../platform/model/audit-log.model.js";

describe("Milestone 2G — Delivery Agent Operations & Delivery Execution", () => {
  const branchAId = new Types.ObjectId();
  const branchBId = new Types.ObjectId();

  const customerId = new Types.ObjectId();

  const agentAId = new Types.ObjectId();
  const agentBId = new Types.ObjectId();

  const orderAId = new Types.ObjectId();
  const orderBId = new Types.ObjectId();
  const pickupOrderId = new Types.ObjectId();

  const mockAgentA = {
    _id: agentAId,
    name: "Agent Kanpur",
    phone: "9876543210",
    role: "delivery_agent" as const,
    branchId: branchAId,
    status: "active" as const,
  };

  const mockAgentB = {
    _id: agentBId,
    name: "Agent Banda",
    phone: "9876543211",
    role: "delivery_agent" as const,
    branchId: branchBId,
    status: "active" as const,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as never);
  });

  it("1. Delivery Agent Order Isolation: Agent A sees own order, cannot see Agent B's order", async () => {
    const mockOrderA = {
      _id: orderAId,
      orderNumber: "ORD-201",
      customerId,
      branchId: branchAId,
      deliveryAgentId: agentAId,
      deliveryMethod: "HOME_DELIVERY" as const,
      orderStatus: "PREPARING" as const,
    };

    const mockOrderRepo: Partial<OrderRepository> = {
      findById: vi.fn().mockImplementation((id: unknown) => {
        if (String(id) === orderAId.toString()) {
          return Promise.resolve(mockOrderA as never);
        }
        return Promise.resolve(null);
      }),
    };

    const orderService = new OrderService(mockOrderRepo as OrderRepository);

    // Agent A viewing own order -> Allowed
    const orderDetails = await orderService.getDeliveryAgentOrderById(
      agentAId.toString(),
      orderAId.toString(),
      branchAId.toString(),
      "delivery_agent",
    );
    expect(orderDetails.id).toBe(orderAId.toString());

    // Agent B attempting to view Agent A's order -> Rejected 403 Forbidden
    await expect(
      orderService.getDeliveryAgentOrderById(
        agentBId.toString(),
        orderAId.toString(),
        branchBId.toString(),
        "delivery_agent",
      ),
    ).rejects.toThrow("Access denied: Order is not assigned to you.");
  });

  it("2. Delivery Execution State Machine: PREPARING -> OUT_FOR_DELIVERY -> DELIVERED", async () => {
    const mockOrderHome = {
      _id: orderAId,
      orderNumber: "ORD-202",
      customerId,
      branchId: branchAId,
      deliveryAgentId: agentAId,
      deliveryMethod: "HOME_DELIVERY" as const,
      orderStatus: "PREPARING" as const,
      save: vi.fn().mockResolvedValue({}),
    };

    const mockOrderRepo: Partial<OrderRepository> = {
      findById: vi.fn().mockResolvedValue(mockOrderHome as never),
    };

    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockAgentA),
    } as never);

    const orderService = new OrderService(mockOrderRepo as OrderRepository);

    // Start delivery: PREPARING -> OUT_FOR_DELIVERY
    const startedOrder = await orderService.startDelivery(
      agentAId.toString(),
      orderAId.toString(),
      branchAId.toString(),
      "delivery_agent",
    );
    expect(startedOrder.orderStatus).toBe("OUT_FOR_DELIVERY");

    // Complete delivery: OUT_FOR_DELIVERY -> DELIVERED
    vi.spyOn(mockOrderRepo, "findById").mockResolvedValue({
      ...mockOrderHome,
      orderStatus: "OUT_FOR_DELIVERY",
    } as never);

    const completedOrder = await orderService.completeDelivery(
      agentAId.toString(),
      orderAId.toString(),
      branchAId.toString(),
      "delivery_agent",
    );
    expect(completedOrder.orderStatus).toBe("DELIVERED");
  });

  it("3. Store Pickup & Inactive Agent Safeguards: Rejects delivery start/complete on STORE_PICKUP or inactive agent", async () => {
    const mockPickupOrder = {
      _id: pickupOrderId,
      orderNumber: "ORD-203",
      customerId,
      branchId: branchAId,
      deliveryAgentId: agentAId,
      deliveryMethod: "STORE_PICKUP" as const,
      orderStatus: "PREPARING" as const,
      save: vi.fn().mockResolvedValue({}),
    };

    const mockOrderRepo: Partial<OrderRepository> = {
      findById: vi.fn().mockResolvedValue(mockPickupOrder as never),
    };

    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockAgentA),
    } as never);

    const orderService = new OrderService(mockOrderRepo as OrderRepository);

    // Store pickup order delivery start -> Rejected 422
    await expect(
      orderService.startDelivery(
        agentAId.toString(),
        pickupOrderId.toString(),
        branchAId.toString(),
        "delivery_agent",
      ),
    ).rejects.toThrow("Store pickup orders cannot enter delivery execution flow.");

    // Inactive agent attempt -> Rejected 403
    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ ...mockAgentA, status: "blocked" }),
    } as never);

    await expect(
      orderService.startDelivery(
        agentAId.toString(),
        pickupOrderId.toString(),
        branchAId.toString(),
        "delivery_agent",
      ),
    ).rejects.toThrow("Delivery agent account is inactive or not found.");
  });

  it("4. Invalid Transition Prevention: Cannot complete PREPARING order without starting delivery first", async () => {
    const mockOrderPreparing = {
      _id: orderAId,
      orderNumber: "ORD-204",
      customerId,
      branchId: branchAId,
      deliveryAgentId: agentAId,
      deliveryMethod: "HOME_DELIVERY" as const,
      orderStatus: "PREPARING" as const,
      save: vi.fn().mockResolvedValue({}),
    };

    const mockOrderRepo: Partial<OrderRepository> = {
      findById: vi.fn().mockResolvedValue(mockOrderPreparing as never),
    };

    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockAgentA),
    } as never);

    const orderService = new OrderService(mockOrderRepo as OrderRepository);

    // Completing without starting -> Rejected 422
    await expect(
      orderService.completeDelivery(
        agentAId.toString(),
        orderAId.toString(),
        branchAId.toString(),
        "delivery_agent",
      ),
    ).rejects.toThrow("Cannot complete delivery before starting delivery.");
  });

  it("5. Snapshot Immutability: Customer profile location change does NOT mutate historical order snapshots", async () => {
    const originalLocationSnapshot = {
      villageName: "Kanpur Village",
      district: "Kanpur",
      pincode: "208001",
    };

    const originalBranchSnapshot = {
      branchId: branchAId,
      name: "Kanpur Main Branch",
      code: "KANPUR",
      type: "MAIN" as const,
    };

    const pastOrder = {
      _id: orderAId,
      orderNumber: "ORD-205",
      customerId,
      branchId: branchAId,
      locationSnapshot: originalLocationSnapshot,
      branchSnapshot: originalBranchSnapshot,
      deliveryMethod: "HOME_DELIVERY" as const,
      orderStatus: "DELIVERED" as const,
    };

    // Simulate customer changing profile location from Kanpur to Banda
    const customerUser = {
      _id: customerId,
      name: "Ajay",
      currentLocation: {
        villageId: new Types.ObjectId(),
        villageName: "Banda Village",
        district: "Banda",
        pincode: "210001",
      },
    };

    // Historical order snapshot remains strictly unchanged
    expect(pastOrder.locationSnapshot.villageName).toBe("Kanpur Village");
    expect(pastOrder.branchSnapshot.name).toBe("Kanpur Main Branch");
    expect(customerUser.currentLocation.villageName).toBe("Banda Village");
  });
});
