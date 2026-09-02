import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import type { CouponService } from "../service/coupon.service.js";

export class CouponController {
  public constructor(private readonly couponService: CouponService) {}

  public createCoupon = async (req: Request, res: Response): Promise<void> => {
    const coupon = await this.couponService.createCoupon(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Coupon created successfully.",
      data: { coupon },
    });
  };

  public getAllCoupons = async (_req: Request, res: Response): Promise<void> => {
    const coupons = await this.couponService.getAllCoupons();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { coupons },
    });
  };

  public getCouponById = async (req: Request, res: Response): Promise<void> => {
    const coupon = await this.couponService.getCouponById(String(req.params.id));
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { coupon },
    });
  };

  public updateCoupon = async (req: Request, res: Response): Promise<void> => {
    const coupon = await this.couponService.updateCoupon(String(req.params.id), req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Coupon updated successfully.",
      data: { coupon },
    });
  };

  public deleteCoupon = async (req: Request, res: Response): Promise<void> => {
    await this.couponService.deleteCoupon(String(req.params.id));
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  };

  public toggleCouponStatus = async (req: Request, res: Response): Promise<void> => {
    const coupon = await this.couponService.toggleCouponStatus(String(req.params.id));
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Coupon status toggled to ${coupon.isActive ? "active" : "inactive"}.`,
      data: { coupon },
    });
  };

  public validateCoupon = async (req: Request, res: Response): Promise<void> => {
    const { code, subtotal } = req.body;
    const result = await this.couponService.validateAndCalculateDiscount(
      code,
      Number(subtotal) || 0,
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  };
}
