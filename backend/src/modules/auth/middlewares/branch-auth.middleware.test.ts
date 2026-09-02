import type { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { AuthenticatedRequest } from "../types/index.js";
import {
  requireBranchAdmin,
  requireBranchScope,
  requireCentralAdmin,
} from "./branch-auth.middleware.js";

const mockBranchAId = new Types.ObjectId().toString();
const mockBranchBId = new Types.ObjectId().toString();

const createMockReqRes = (role: "admin" | "branch_admin" | "customer", branchId?: string) => {
  const req = {
    user: {
      id: "user-123",
      name: "Test User",
      role,
      branchId,
      isVerified: true,
    },
    params: {},
  } as unknown as Request;

  const res = {} as Response;
  const next = vi.fn();

  return { req, res, next };
};

describe("Branch Authorization Middlewares", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("requireCentralAdmin", () => {
    it("allows Central Admin ('admin') users", () => {
      const { req, res, next } = createMockReqRes("admin");

      requireCentralAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("rejects Branch Admin ('branch_admin') users with 403 AppError", () => {
      const { req, res, next } = createMockReqRes("branch_admin", mockBranchAId);

      requireCentralAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const err = (next.mock.calls as unknown as [AppError[]])[0][0];
      expect(err?.statusCode).toBe(403);
    });

    it("rejects Customer ('customer') users with 403 AppError", () => {
      const { req, res, next } = createMockReqRes("customer");

      requireCentralAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const err = (next.mock.calls as unknown as [AppError[]])[0][0];
      expect(err?.statusCode).toBe(403);
    });
  });

  describe("requireBranchAdmin", () => {
    it("allows Central Admin ('admin') users", () => {
      const { req, res, next } = createMockReqRes("admin");

      requireBranchAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("allows Branch Admin ('branch_admin') users", () => {
      const { req, res, next } = createMockReqRes("branch_admin", mockBranchAId);

      requireBranchAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("rejects Customer ('customer') users with 403 AppError", () => {
      const { req, res, next } = createMockReqRes("customer");

      requireBranchAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const err = (next.mock.calls as unknown as [AppError[]])[0][0];
      expect(err?.statusCode).toBe(403);
    });
  });

  describe("requireBranchScope", () => {
    const extractor = (req: Request) => (req as unknown as { params: { branchId?: string } }).params.branchId;
    const guard = requireBranchScope(extractor);

    it("allows Central Admin ('admin') to access any branch resource", () => {
      const { req, res, next } = createMockReqRes("admin");
      req.params = { branchId: mockBranchBId };

      guard(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("allows Branch Admin to access their assigned branch resource", () => {
      const { req, res, next } = createMockReqRes("branch_admin", mockBranchAId);
      req.params = { branchId: mockBranchAId };

      guard(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("rejects Branch Admin trying to access another branch resource with 403 AppError", () => {
      const { req, res, next } = createMockReqRes("branch_admin", mockBranchAId);
      req.params = { branchId: mockBranchBId }; // Mismatch!

      guard(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const err = (next.mock.calls as unknown as [AppError[]])[0][0];
      expect(err?.statusCode).toBe(403);
    });
  });
});
