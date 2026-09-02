import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { CouponRepository } from "../repository/coupon.repository.js";
import type { Coupon } from "../model/coupon.model.js";
import type { CreateCouponDto, UpdateCouponDto } from "../dto/coupon.dto.js";

export interface CouponDiscountResult {
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  discountAmount: number;
  description?: string;
}

export class CouponService {
  public constructor(private readonly couponRepository: CouponRepository) {}

  public async createCoupon(dto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponRepository.findByCode(dto.code);
    if (existing) {
      throw new AppError(
        `Coupon code "${dto.code}" already exists.`,
        HTTP_STATUS.CONFLICT,
        [],
        true,
        APP_ERROR_CODES.COUPON_CODE_ALREADY_EXISTS,
      );
    }

    if (dto.endDate <= dto.startDate) {
      throw new AppError(
        "End date must be after start date.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    return this.couponRepository.create(dto);
  }

  public async getAllCoupons(): Promise<Coupon[]> {
    return this.couponRepository.findAll();
  }

  public async getCouponById(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new AppError(
        "Coupon not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.COUPON_NOT_FOUND,
      );
    }
    return coupon;
  }

  public async updateCoupon(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.getCouponById(id);

    if (dto.code && dto.code !== coupon.code) {
      const existing = await this.couponRepository.findByCode(dto.code);
      if (existing) {
        throw new AppError(
          `Coupon code "${dto.code}" already exists.`,
          HTTP_STATUS.CONFLICT,
          [],
          true,
          APP_ERROR_CODES.COUPON_CODE_ALREADY_EXISTS,
        );
      }
    }

    const updated = await this.couponRepository.update(id, dto);
    if (!updated) {
      throw new AppError(
        "Failed to update coupon.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        [],
        true,
        APP_ERROR_CODES.INTERNAL_SERVER_ERROR,
      );
    }
    return updated;
  }

  public async deleteCoupon(id: string): Promise<void> {
    const deleted = await this.couponRepository.delete(id);
    if (!deleted) {
      throw new AppError(
        "Coupon not found or already deleted.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.COUPON_NOT_FOUND,
      );
    }
  }

  public async toggleCouponStatus(id: string): Promise<Coupon> {
    const coupon = await this.getCouponById(id);
    const updated = await this.couponRepository.update(id, {
      isActive: !coupon.isActive,
    });
    return updated!;
  }

  public async validateAndCalculateDiscount(
    code: string,
    subtotal: number,
  ): Promise<CouponDiscountResult> {
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new AppError(
        `Invalid coupon code "${code}".`,
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.COUPON_NOT_FOUND,
      );
    }

    if (!coupon.isActive) {
      throw new AppError(
        `Coupon "${coupon.code}" is currently inactive.`,
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.COUPON_INACTIVE,
      );
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new AppError(
        `Coupon "${coupon.code}" has expired or is not active yet.`,
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.COUPON_EXPIRED,
      );
    }

    if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError(
        `Coupon "${coupon.code}" usage limit has been reached.`,
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.COUPON_USAGE_LIMIT_EXCEEDED,
      );
    }

    if (subtotal <= 0) {
      throw new AppError(
        "Your cart is empty. Please add items to your cart before applying a promo code.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.ORDER_CART_EMPTY,
      );
    }

    if (subtotal < coupon.minOrderAmount) {
      throw new AppError(
        `Minimum order subtotal of ₹${coupon.minOrderAmount} required for coupon "${coupon.code}".`,
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.COUPON_MIN_AMOUNT_NOT_MET,
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (
        coupon.maxDiscountAmount !== undefined &&
        coupon.maxDiscountAmount > 0
      ) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      // FLAT
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      description: coupon.description,
    };
  }

  public async incrementCouponUsage(code: string): Promise<void> {
    const coupon = await this.couponRepository.findByCode(code);
    if (coupon) {
      await this.couponRepository.incrementUsage(coupon._id.toString());
    }
  }
}
