import mongoose, { type FilterQuery, type HydratedDocument } from "mongoose";

import { escapeRegex } from "../../../shared/utils/escape-regex.js";
import {
  CustomCakeOptionModel,
  type CustomCakeOption,
  type CustomCakeOptionType,
} from "../model/custom-cake-option.model.js";
import {
  CustomCakeInquiryModel,
  type CustomCakeInquiry,
  type CustomCakeInquiryStatus,
} from "../model/custom-cake-inquiry.model.js";

export class CustomCakeRepository {
  // --- Options Repository Methods ---
  public async findAllOptions(type?: CustomCakeOptionType, onlyActive = true): Promise<HydratedDocument<CustomCakeOption>[]> {
    const filter: FilterQuery<CustomCakeOption> = {};
    if (type) filter.type = type;
    if (onlyActive) filter.isActive = true;

    return CustomCakeOptionModel.find(filter).sort({ displayOrder: 1, createdAt: 1 }).exec();
  }

  public async findOptionById(id: string): Promise<HydratedDocument<CustomCakeOption> | null> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const res = await CustomCakeOptionModel.findById(id).exec();
      if (res) return res;
    }
    return CustomCakeOptionModel.findOne({ $or: [{ slug: id }, { _id: id }] }).exec();
  }

  public async findOptionBySlug(slug: string, type: CustomCakeOptionType): Promise<HydratedDocument<CustomCakeOption> | null> {
    return CustomCakeOptionModel.findOne({ slug, type }).exec();
  }

  public async createOption(data: Partial<CustomCakeOption>): Promise<HydratedDocument<CustomCakeOption>> {
    const option = new CustomCakeOptionModel(data);
    return option.save();
  }

  public async updateOption(id: string, data: Partial<CustomCakeOption>): Promise<HydratedDocument<CustomCakeOption> | null> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const res = await CustomCakeOptionModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
      if (res) return res;
    }
    return CustomCakeOptionModel.findOneAndUpdate(
      { $or: [{ slug: id }, { _id: id }] },
      { $set: data },
      { new: true }
    ).exec();
  }

  public async deleteOption(id: string): Promise<boolean> {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const res = await CustomCakeOptionModel.findByIdAndDelete(id).exec();
      if (res) return true;
    }
    const res2 = await CustomCakeOptionModel.findOneAndDelete({
      $or: [{ slug: id }, { _id: id }]
    }).exec();
    return res2 !== null;
  }

  public async countOptions(): Promise<number> {
    return CustomCakeOptionModel.countDocuments().exec();
  }

  // --- Inquiries Repository Methods ---
  public async createInquiry(data: Partial<CustomCakeInquiry>): Promise<HydratedDocument<CustomCakeInquiry>> {
    const inquiry = new CustomCakeInquiryModel(data);
    return inquiry.save();
  }

  public async findAllInquiries(filters: {
    status?: CustomCakeInquiryStatus;
    search?: string;
    userId?: string;
  } = {}): Promise<HydratedDocument<CustomCakeInquiry>[]> {
    const query: FilterQuery<CustomCakeInquiry> = {};
    if (filters.status) query.status = filters.status;
    if (filters.userId) query.userId = filters.userId;
    if (filters.search && filters.search.trim()) {
      const regex = new RegExp(escapeRegex(filters.search.trim()), "i");
      query.$or = [
        { inquiryNumber: regex },
        { customerName: regex },
        { customerPhone: regex },
        { flavor: regex },
        { designTheme: regex },
        { queryText: regex },
      ];
    }

    return CustomCakeInquiryModel.find(query)
      .populate("userId", "name email phone")
      .populate("adminRecommendation.recommendedProductId", "name slug price thumbnailUrl mainImage")
      .sort({ createdAt: -1 })
      .exec();
  }

  public async findInquiryById(id: string): Promise<HydratedDocument<CustomCakeInquiry> | null> {
    return CustomCakeInquiryModel.findById(id)
      .populate("userId", "name email phone")
      .populate("adminRecommendation.recommendedProductId", "name slug price thumbnailUrl mainImage")
      .exec();
  }

  public async findInquiryByNumber(inquiryNumber: string): Promise<HydratedDocument<CustomCakeInquiry> | null> {
    return CustomCakeInquiryModel.findOne({ inquiryNumber: inquiryNumber.toUpperCase() })
      .populate("userId", "name email phone")
      .populate("adminRecommendation.recommendedProductId", "name slug price thumbnailUrl mainImage")
      .exec();
  }

  public async updateInquiry(id: string, data: Partial<CustomCakeInquiry>): Promise<HydratedDocument<CustomCakeInquiry> | null> {
    return CustomCakeInquiryModel.findByIdAndUpdate(id, { $set: data }, { new: true })
      .populate("userId", "name email phone")
      .populate("adminRecommendation.recommendedProductId", "name slug price thumbnailUrl mainImage")
      .exec();
  }

  public async deleteInquiry(id: string): Promise<boolean> {
    const res = await CustomCakeInquiryModel.findByIdAndDelete(id).exec();
    return res !== null;
  }
}
