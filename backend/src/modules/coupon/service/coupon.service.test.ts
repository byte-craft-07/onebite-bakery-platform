import { describe, expect, it, vi } from "vitest";
import { CouponService } from "./coupon.service.js";
import { CouponController } from "../controller/coupon.controller.js";
import type { CouponRepository } from "../repository/coupon.repository.js";
import type { Coupon } from "../model/coupon.model.js";
import { Types } from "mongoose";

describe("Coupon Customer Access & Active Offers", () => {
  const mockCoupons: Coupon[] = [
    {
      _id: new Types.ObjectId(),
      code: "WELCOME100",
      description: "Flat ₹100 Off",
      discountType: "FLAT",
      discountValue: 100,
      minOrderAmount: 499,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      usedCount: 5,
      usageLimit: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      code: "EXPIRED50",
      description: "Expired coupon",
      discountType: "FLAT",
      discountValue: 50,
      minOrderAmount: 200,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      usedCount: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      code: "MAXEDOUT",
      description: "Usage limit reached",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 100,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      usedCount: 50,
      usageLimit: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("should return only active, non-exhausted coupons in getActiveCoupons", async () => {
    const mockRepo = {
      findAll: vi.fn(),
      findActive: vi.fn().mockResolvedValue([mockCoupons[0], mockCoupons[2]]),
      findById: vi.fn(),
      findByCode: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      incrementUsage: vi.fn(),
    } as unknown as CouponRepository;

    const service = new CouponService(mockRepo);
    const active = await service.getActiveCoupons();

    expect(active).toHaveLength(1);
    expect(active[0].code).toBe("WELCOME100");
  });

  it("CouponController should return active coupons for customer/guest and all for admin", async () => {
    const mockRepo = {
      findAll: vi.fn().mockResolvedValue(mockCoupons),
      findActive: vi.fn().mockResolvedValue([mockCoupons[0]]),
    } as unknown as CouponRepository;

    const service = new CouponService(mockRepo);
    const controller = new CouponController(service);

    // 1. Customer request
    const customerReq = { user: { role: "customer" } } as any;
    let customerResult: any = null;
    const customerRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((data) => {
        customerResult = data;
      }),
    } as any;

    await controller.getAllCoupons(customerReq, customerRes);
    expect(customerResult.success).toBe(true);
    expect(customerResult.data.coupons).toHaveLength(1);
    expect(customerResult.data.coupons[0].code).toBe("WELCOME100");

    // 2. Anonymous / Guest request (no req.user)
    const guestReq = {} as any;
    let guestResult: any = null;
    const guestRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((data) => {
        guestResult = data;
      }),
    } as any;

    await controller.getAllCoupons(guestReq, guestRes);
    expect(guestResult.success).toBe(true);
    expect(guestResult.data.coupons).toHaveLength(1);

    // 3. Admin request
    const adminReq = { user: { role: "admin" } } as any;
    let adminResult: any = null;
    const adminRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn((data) => {
        adminResult = data;
      }),
    } as any;

    await controller.getAllCoupons(adminReq, adminRes);
    expect(adminResult.success).toBe(true);
    expect(adminResult.data.coupons).toHaveLength(3);
  });
});
