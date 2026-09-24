import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BranchProductModel } from "./model/branch-product.model.js";
import { BranchService } from "./service/branch.service.js";
import type { BranchRepository } from "./repository/branch.repository.js";
import { ProductModel } from "../product/model/product.model.js";
import { AppError } from "../../shared/errors/app-error.js";

describe("Milestone 2E — Central Admin & Branch Admin Operational Control & Security", () => {
  const branchAId = new Types.ObjectId();
  const branchBId = new Types.ObjectId();
  const branchAdminAId = new Types.ObjectId();

  const branchADoc = {
    _id: branchAId,
    name: "Branch Alpha",
    code: "ALPHA",
    type: "MAIN" as const,
    isActive: true,
    address: { street: "Alpha St", city: "City A", state: "ST", pincode: "100001" },
    phone: "9876543210",
    email: "alpha@onebitebakery.in",
  };

  const branchBDoc = {
    _id: branchBId,
    name: "Branch Beta",
    code: "BETA",
    type: "FRANCHISE" as const,
    isActive: true,
    address: { street: "Beta St", city: "City B", state: "ST", pincode: "200002" },
    phone: "9876543211",
    email: "beta@onebitebakery.in",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("CASE 1: Central Admin gets branch product matrix", async () => {
    const mockBranchRepo: Partial<BranchRepository> = {
      findAll: vi.fn().mockResolvedValue([branchADoc, branchBDoc] as never),
    };

    vi.spyOn(ProductModel, "find").mockImplementation(() => ({
      sort: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      }),
    }) as never);

    vi.spyOn(BranchProductModel, "find").mockImplementation(() => ({
      lean: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      }),
    }) as never);

    const service = new BranchService(mockBranchRepo as BranchRepository);
    const matrixData = await service.getBranchProductMatrix();

    expect(matrixData.branches.length).toBe(2);
    expect(matrixData.branches[0]?.code).toBe("ALPHA");
  });

  it("CASE 2 & 3: Security & RBAC — Scoped Branch Admin authorization enforcement", async () => {
    const { requireBranchScope } = await import("../auth/middlewares/branch-auth.middleware.js");

    const reqBranchA = {
      user: { id: branchAdminAId.toString(), role: "branch_admin", branchId: branchAId },
      params: { branchId: branchAId.toString() },
    } as never;

    const reqBranchB = {
      user: { id: branchAdminAId.toString(), role: "branch_admin", branchId: branchAId },
      params: { branchId: branchBId.toString() },
    } as never;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;

    const nextFnA = vi.fn();
    const nextFnB = vi.fn();

    const scopeMiddleware = requireBranchScope((r: unknown) => (r as { params: { branchId: string } }).params.branchId);

    // Branch Admin A accessing Branch A -> allowed
    scopeMiddleware(reqBranchA, res, nextFnA);
    expect(nextFnA).toHaveBeenCalledWith();

    // Branch Admin A attempting to access Branch B -> rejected with AppError
    scopeMiddleware(reqBranchB, res, nextFnB);
    expect(nextFnB).toHaveBeenCalledWith(expect.any(AppError));
  });

  it("CASE 4: Branch Admin updating own branch product availability succeeds and emits audit log", async () => {
    const { AuditLogModel } = await import("../platform/model/audit-log.model.js");
    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as never);

    const mockBranchRepo: Partial<BranchRepository> = {
      findById: vi.fn().mockResolvedValue(branchADoc as never),
    };

    const targetProductId = new Types.ObjectId();

    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue({
        _id: targetProductId,
        name: "Test Cake",
        slug: "test-cake",
        price: 300,
        isAvailable: true,
        stockQuantity: 10,
        lowStockThreshold: 5,
        allowBackorder: false,
      }),
    }) as never);

    const mockBranchProductDoc = {
      _id: new Types.ObjectId(),
      branchId: branchAId,
      productId: targetProductId,
      isAvailable: true,
      stockQuantity: 10,
      lowStockThreshold: 5,
      allowBackorder: false,
      updatedAt: new Date(),
      save: vi.fn().mockResolvedValue({}),
    };

    vi.spyOn(BranchProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(mockBranchProductDoc),
    }) as never);

    const service = new BranchService(mockBranchRepo as BranchRepository);
    const updated = await service.updateBranchProduct(
      branchAId.toString(),
      targetProductId.toString(),
      { isAvailable: false, stockQuantity: 15 },
      branchAdminAId.toString(),
    );

    expect(updated.isAvailable).toBe(false);
    expect(updated.stockQuantity).toBe(15);
    expect(AuditLogModel.create).toHaveBeenCalled();
  });
});
