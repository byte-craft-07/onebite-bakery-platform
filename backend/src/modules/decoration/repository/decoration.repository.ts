import { Types, type HydratedDocument, type FilterQuery } from "mongoose";
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
        { nameHi: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    return DecorationModel.find(filter).sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  public async findById(id: string): Promise<HydratedDocument<Decoration> | null> {
    if (Types.ObjectId.isValid(id)) {
      const byId = await DecorationModel.findById(id).exec();
      if (byId) return byId;
    }
    return this.findBySlug(id);
  }

  public async findBySlug(slug: string): Promise<HydratedDocument<Decoration> | null> {
    const clean = slug.trim().toLowerCase();
    return DecorationModel.findOne({
      $or: [
        { slug: clean },
        { slug: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
      ],
    }).exec();
  }

  public async update(id: string, data: Partial<Decoration>): Promise<HydratedDocument<Decoration> | null> {
    if (!Types.ObjectId.isValid(id)) {
      const existing = await this.findBySlug(id);
      if (!existing) return null;
      return DecorationModel.findByIdAndUpdate(existing._id, { $set: data }, { new: true }).exec();
    }
    return DecorationModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  public async findDistinctCategories(): Promise<string[]> {
    const categories = await DecorationModel.distinct("category").exec();
    return categories
      .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      .map((c) => c.trim());
  }

  public async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      const existing = await this.findBySlug(id);
      if (!existing) return false;
      const res = await DecorationModel.findByIdAndDelete(existing._id).exec();
      return res !== null;
    }
    const result = await DecorationModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const decorationRepository = new DecorationRepository();
