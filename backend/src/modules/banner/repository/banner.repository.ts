import { type Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { BannerModel, type Banner } from "../model/banner.model.js";

export class BannerRepository extends BaseRepository<Banner> {
  constructor() {
    super(BannerModel);
  }

  async findActiveBanners(placement: string = "home_hero"): Promise<Banner[]> {
    return this.model
      .find({
        isActive: true,
        placement,
      })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
  }

  async findAllBanners(): Promise<Banner[]> {
    return this.model
      .find({})
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
  }

  async findBannerById(id: string | Types.ObjectId): Promise<Banner | null> {
    return this.model.findById(id).lean();
  }

  async createBanner(data: Partial<Banner>): Promise<Banner> {
    const banner = new this.model(data);
    return (await banner.save()).toObject();
  }

  async updateBanner(
    id: string | Types.ObjectId,
    data: Partial<Banner>,
  ): Promise<Banner | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .lean();
  }

  async deleteBanner(id: string | Types.ObjectId): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id);
    return !!res;
  }

  async toggleStatus(
    id: string | Types.ObjectId,
    isActive: boolean,
  ): Promise<Banner | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: { isActive } }, { new: true })
      .lean();
  }
}

export const bannerRepository = new BannerRepository();
