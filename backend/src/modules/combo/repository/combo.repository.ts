import type { HydratedDocument } from "mongoose";
import { ComboModel, type Combo } from "../model/combo.model.js";

export class ComboRepository {
  public async create(data: Partial<Combo>): Promise<HydratedDocument<Combo>> {
    const combo = new ComboModel(data);
    return combo.save();
  }

  public async count(): Promise<number> {
    return ComboModel.countDocuments().exec();
  }

  public async findActive(): Promise<HydratedDocument<Combo>[]> {
    return ComboModel.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  public async findAllAdmin(): Promise<HydratedDocument<Combo>[]> {
    return ComboModel.find().sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  public async findById(id: string): Promise<HydratedDocument<Combo> | null> {
    return ComboModel.findById(id).exec();
  }

  public async findBySlug(slug: string): Promise<HydratedDocument<Combo> | null> {
    return ComboModel.findOne({ slug: slug.toLowerCase() }).exec();
  }

  public async update(id: string, data: Partial<Combo>): Promise<HydratedDocument<Combo> | null> {
    return ComboModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  public async delete(id: string): Promise<boolean> {
    const result = await ComboModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}

export const comboRepository = new ComboRepository();
