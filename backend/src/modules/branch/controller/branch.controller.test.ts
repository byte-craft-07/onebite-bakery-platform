import type { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthenticatedRequest } from "../../auth/index.js";
import { BranchController } from "./branch.controller.js";
import type { BranchResponse, BranchService } from "../service/branch.service.js";

const mockBranchResponse: BranchResponse = {
  id: new Types.ObjectId().toString(),
  name: "Main Bakery Branch",
  code: "MAIN-001",
  type: "MAIN",
  address: {
    street: "123 Baker Street",
    city: "Guwahati",
    state: "Assam",
    pincode: "781001",
  },
  phone: "9876543210",
  email: "main@onebitebakery.in",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("BranchController", () => {
  let mockBranchService: Partial<BranchService>;
  let controller: BranchController;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockBranchService = {
      createBranch: vi.fn().mockResolvedValue(mockBranchResponse),
      getAllBranches: vi.fn().mockResolvedValue([mockBranchResponse]),
      getBranchById: vi.fn().mockResolvedValue(mockBranchResponse),
      updateBranch: vi.fn().mockResolvedValue(mockBranchResponse),
      updateBranchStatus: vi.fn().mockResolvedValue(mockBranchResponse),
      assignServiceArea: vi.fn().mockResolvedValue({ message: "Assigned", village: {} as never }),
      unassignServiceArea: vi.fn().mockResolvedValue({ message: "Unassigned" }),
      listServiceAreas: vi.fn().mockResolvedValue([]),
      assignBranchAdmin: vi.fn().mockResolvedValue(mockBranchResponse),
      removeBranchAdmin: vi.fn().mockResolvedValue(mockBranchResponse),
    };

    controller = new BranchController(mockBranchService as BranchService);
  });

  it("handles createBranch request", async () => {
    const req = {
      user: { id: "admin-123", role: "admin" },
      body: {
        name: "Main Bakery Branch",
        code: "MAIN-001",
        type: "MAIN",
        address: {
          street: "123 Baker Street",
          city: "Guwahati",
          state: "Assam",
          pincode: "781001",
        },
        phone: "9876543210",
        email: "main@onebitebakery.in",
      },
    } as unknown as Request;

    const res = createMockResponse();

    await controller.createBranch(req, res);

    expect(mockBranchService.createBranch).toHaveBeenCalledWith(req.body, "admin-123");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { branch: mockBranchResponse },
      }),
    );
  });

  it("handles getAllBranches request", async () => {
    const req = {
      query: { type: "MAIN", isActive: "true" },
    } as unknown as Request;

    const res = createMockResponse();

    await controller.getAllBranches(req, res);

    expect(mockBranchService.getAllBranches).toHaveBeenCalledWith({
      type: "MAIN",
      isActive: true,
      search: undefined,
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { branches: [mockBranchResponse] },
      }),
    );
  });

  it("handles getBranchById request", async () => {
    const req = {
      params: { branchId: mockBranchResponse.id },
    } as unknown as Request;

    const res = createMockResponse();

    await controller.getBranchById(req, res);

    expect(mockBranchService.getBranchById).toHaveBeenCalledWith(mockBranchResponse.id);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { branch: mockBranchResponse },
      }),
    );
  });

  it("handles updateBranchStatus request", async () => {
    const req = {
      user: { id: "admin-123", role: "admin" },
      params: { branchId: mockBranchResponse.id },
      body: { isActive: false },
    } as unknown as Request;

    const res = createMockResponse();

    await controller.updateBranchStatus(req, res);

    expect(mockBranchService.updateBranchStatus).toHaveBeenCalledWith(
      mockBranchResponse.id,
      false,
      "admin-123",
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  it("handles assignBranchAdmin request", async () => {
    const req = {
      user: { id: "admin-123", role: "admin" },
      params: { branchId: mockBranchResponse.id },
      body: { userId: "user-456" },
    } as unknown as Request;

    const res = createMockResponse();

    await controller.assignBranchAdmin(req, res);

    expect(mockBranchService.assignBranchAdmin).toHaveBeenCalledWith(
      mockBranchResponse.id,
      { userId: "user-456" },
      "admin-123",
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });
});
