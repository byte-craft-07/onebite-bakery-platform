import type { HydratedDocument } from "mongoose";

import { CouponModel, type Coupon } from "../model/coupon.model.js";
import type { CreateCouponDto, UpdateCouponDto } from "../dto/coupon.dto.js";

export class CouponRepository {
  public async create(dto: CreateCouponDto): Promise<HydratedDocument<Coupon>> {
    const coupon = new CouponModel(dto);
    return coupon.save();
  }

  public async findAll(): Promise<HydratedDocument<Coupon>[]> {
    return CouponModel.find().sort({ createdAt: -1 }).exec();
  }

  public async findById(id: string): Promise<HydratedDocument<Coupon> | null> {
    return CouponModel.findById(id).exec();
  }

  public async findByCode(code: string): Promise<HydratedDocument<Coupon> | null> {
    return CouponModel.findOne({ code: code.toUpperCase() }).exec();
  }

  public async update(
    id: string,
    dto: UpdateCouponDto,
  ): Promise<HydratedDocument<Coupon> | null> {
    return CouponModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
  }

  public async delete(id: string): Promise<boolean> {
    const res = await CouponModel.findByIdAndDelete(id).exec();
    return res !== null;
  }

  public async incrementUsage(id: string): Promise<void> {
    await CouponModel.findByIdAndUpdate(id, { $inc: { usedCount: 1 } }).exec();
  }
}
