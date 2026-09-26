import type { HydratedDocument, FilterQuery } from "mongoose";
import { DecorationModel, type Decoration } from "../model/decoration.model.js";

export class DecorationRepository {
  public async create(data: Partial<Decoration>): Promise<HydratedDocument<Decoration>> {
    const decoration = new DecorationModel(data);
    return decoration.save();
  }

  public async count(): Promise<number> {
    return DecorationModel.countDocuments().exec();
  }

  public async findActive(category?: string): Promise<HydratedDocument<Decoration>[]> {
    const filter: FilterQuery<Decoration> = { isActive: true };
    if (category && category !== "ALL" && category !== "All") {
      filter.category = category;
    }
    return DecorationModel.find(filter).sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  public async findAllAdmin(params?: {
    search?: string;
    category?: string;
    status?: string;
  }): Promise<HydratedDocument<Decoration>[]> {
    const filter: FilterQuery<Decoration> = {};

    if (params?.category && params.category !== "ALL") {
      filter.category = params.category;
    }

    if (params?.status === "ACTIVE") {
      filter.isActive = true;
    } else if (params?.status === "INACTIVE") {
      filter.isActive = false;
    } else if (params?.status === "IN_STOCK") {
      filter.inStock = true;
    } else if (params?.status === "OUT_OF_STOCK") {
      filter.inStock = false;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    return DecorationModel.find(filter).sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  public async findById(id: string): Promise<HydratedDocument<Decoration> | null> {
    return DecorationModel.findById(id).exec();
  }

  public async findBySlug(slug: string): Promise<HydratedDocument<Decoration> | null> {
    return DecorationModel.findOne({ slug: slug.toLowerCase() }).exec();
  }

  public async update(id: string, data: Partial<Decoration>): Promise<HydratedDocument<Decoration> | null> {
    return DecorationModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  public async delete(id: string): Promise<boolean> {
    const result = await DecorationModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const decorationRepository = new DecorationRepository();
