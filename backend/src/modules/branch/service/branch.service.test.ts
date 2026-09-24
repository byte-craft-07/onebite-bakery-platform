import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import { AuditLogModel } from "../../platform/model/audit-log.model.js";
import { UserModel } from "../../user/model/user.model.js";
import { VillageModel } from "../../village/model/village.model.js";
import type { CreateBranchDto } from "../dto/branch.dto.js";
import type { BranchRepository } from "../repository/branch.repository.js";
import { BranchService } from "./branch.service.js";

const mockBranchId = new Types.ObjectId();
const mockManagerId = new Types.ObjectId();
const mockVillageId = new Types.ObjectId();

const createMockBranchDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: mockBranchId,
  name: "Main Bakery Branch",
  code: "MAIN-001",
  type: "MAIN",
  address: {
    street: "123 Baker Street",
    city: "Guwahati",
    state: "Assam",
    pincode: "781001",
    landmark: "Clock Tower",
  },
  phone: "9876543210",
  email: "main@onebitebakery.in",
  managerId: undefined,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("BranchService", () => {
  let mockBranchRepository: Partial<BranchRepository>;
  let service: BranchService;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockBranchRepository = {
      create: vi.fn().mockImplementation((data) => Promise.resolve(createMockBranchDoc(data))),
      findById: vi.fn().mockResolvedValue(createMockBranchDoc()),
      findByCode: vi.fn().mockResolvedValue(null),
      findByManager: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([createMockBranchDoc()]),
      update: vi.fn().mockImplementation((id, update) => Promise.resolve(createMockBranchDoc({ _id: id, ...update }))),
    };

    service = new BranchService(mockBranchRepository as BranchRepository);

    vi.spyOn(AuditLogModel, "create").mockResolvedValue({} as never);
    vi.spyOn(VillageModel, "aggregate").mockResolvedValue([]);
    vi.spyOn(VillageModel, "find").mockImplementation(() => ({
      sort: vi.fn().mockImplementation(() => ({
        lean: vi.fn().mockImplementation(() => ({
          exec: vi.fn().mockResolvedValue([]),
        })),
        exec: vi.fn().mockResolvedValue([]),
      })),
      exec: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof VillageModel.find>));
    vi.spyOn(UserModel, "find").mockImplementation(() => ({
      select: vi.fn().mockImplementation(() => ({
        lean: vi.fn().mockImplementation(() => ({
          exec: vi.fn().mockResolvedValue([]),
        })),
      })),
    } as unknown as ReturnType<typeof UserModel.find>));
  });

  it("creates a new MAIN branch successfully", async () => {
    const dto: CreateBranchDto = {
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
    };

    const res = await service.createBranch(dto, new Types.ObjectId().toString());

    expect(res.name).toBe("Main Bakery Branch");
    expect(res.code).toBe("MAIN-001");
    expect(res.type).toBe("MAIN");
    expect(mockBranchRepository.create).toHaveBeenCalledOnce();
    expect(AuditLogModel.create).toHaveBeenCalledOnce();
  });

  it("rejects branch creation if branch code already exists", async () => {
    vi.spyOn(mockBranchRepository, "findByCode").mockResolvedValue(createMockBranchDoc() as never);

    const dto: CreateBranchDto = {
      name: "Franchise Bakery Branch",
      code: "MAIN-001",
      type: "FRANCHISE",
      address: {
        street: "456 Market Road",
        city: "Guwahati",
        state: "Assam",
        pincode: "781003",
      },
      phone: "9876543211",
      email: "fr1@onebitebakery.in",
    };

    await expect(service.createBranch(dto)).rejects.toBeInstanceOf(AppError);
  });

  it("retrieves branch details by ID with assigned villages", async () => {
    const res = await service.getBranchById(mockBranchId.toString());

    expect(res.id).toBe(mockBranchId.toString());
    expect(res.name).toBe("Main Bakery Branch");
    expect(mockBranchRepository.findById).toHaveBeenCalledWith(mockBranchId);
  });

  it("throws 404 error when querying non-existent branch ID", async () => {
    vi.spyOn(mockBranchRepository, "findById").mockResolvedValue(null);

    await expect(service.getBranchById(new Types.ObjectId().toString())).rejects.toBeInstanceOf(AppError);
  });

  it("updates branch profile information", async () => {
    const updated = await service.updateBranch(
      mockBranchId.toString(),
      { name: "Updated Main Branch", phone: "9998887770" },
      new Types.ObjectId().toString(),
    );

    expect(updated.name).toBe("Updated Main Branch");
    expect(updated.phone).toBe("9998887770");
  });

  it("updates branch active status (deactivate / activate)", async () => {
    const deactivated = await service.updateBranchStatus(
      mockBranchId.toString(),
      false,
      new Types.ObjectId().toString(),
    );

    expect(deactivated.isActive).toBe(false);
  });

  it("assigns a village / service area to an active branch", async () => {
    const mockVillage = {
      _id: mockVillageId,
      name: "Dispur Locality",
      district: "Kamrup",
      pincode: "781005",
      isActive: true,
      branchId: null,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(VillageModel, "findById").mockResolvedValue(mockVillage as never);

    const result = await service.assignServiceArea(
      mockBranchId.toString(),
      { villageId: mockVillageId.toString() },
      new Types.ObjectId().toString(),
    );

    expect(result.village.branchId).toEqual(mockBranchId);
    expect(mockVillage.save).toHaveBeenCalledOnce();
  });

  it("prevents assigning a village that is already assigned to another branch", async () => {
    const otherBranchId = new Types.ObjectId();
    const mockVillage = {
      _id: mockVillageId,
      name: "Dispur Locality",
      district: "Kamrup",
      pincode: "781005",
      isActive: true,
      branchId: otherBranchId,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(VillageModel, "findById").mockResolvedValue(mockVillage as never);

    await expect(
      service.assignServiceArea(
        mockBranchId.toString(),
        { villageId: mockVillageId.toString() },
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("assigns a user as Branch Admin with branch scope", async () => {
    const mockUser = {
      _id: mockManagerId,
      name: "Branch Manager",
      role: "customer",
      branchId: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(UserModel, "findById").mockResolvedValue(mockUser as never);

    const res = await service.assignBranchAdmin(
      mockBranchId.toString(),
      { userId: mockManagerId.toString() },
      new Types.ObjectId().toString(),
    );

    expect(mockUser.role).toBe("branch_admin");
    expect(mockUser.branchId).toEqual(mockBranchId);
    expect(res.managerName).toBe("Branch Manager");
  });

  it("removes Branch Admin assignment from a branch", async () => {
    const mockUser = {
      _id: mockManagerId,
      name: "Branch Manager",
      role: "branch_admin",
      branchId: mockBranchId,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(UserModel, "findById").mockResolvedValue(mockUser as never);

    const res = await service.removeBranchAdmin(
      mockBranchId.toString(),
      mockManagerId.toString(),
      new Types.ObjectId().toString(),
    );

    expect(mockUser.role).toBe("customer");
    expect(mockUser.branchId).toBeUndefined();
    expect(res.managerId).toBeUndefined();
  });

  it("unassigns a village / service area setting branchId to null", async () => {
    const mockVillage = {
      _id: mockVillageId,
      name: "Dispur Locality",
      district: "Kamrup",
      pincode: "781005",
      isActive: true,
      branchId: mockBranchId,
    };

    vi.spyOn(VillageModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockVillage),
    } as unknown as ReturnType<typeof VillageModel.findById>);
    const updateOneSpy = vi.spyOn(VillageModel, "updateOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    } as unknown as ReturnType<typeof VillageModel.updateOne>);

    const res = await service.unassignServiceArea(
      mockBranchId.toString(),
      mockVillageId.toString(),
      new Types.ObjectId().toString(),
    );

    expect(res.message).toContain("unassigned successfully");
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: mockVillageId },
      { $set: { branchId: null } },
    );
  });
});
