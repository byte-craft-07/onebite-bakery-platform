import type {
  FilterQuery,
  HydratedDocument,
  Types,
  UpdateQuery,
} from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { CategoryModel, type Category } from "../model/index.js";

export class CategoryRepository extends BaseRepository<Category> {
  public constructor() {
    super(CategoryModel);
  }

  public async findBySlug(
    slug: string,
  ): Promise<HydratedDocument<Category> | null> {
    return CategoryModel.findOne({ slug }).exec();
  }

  public async findByName(
    name: string,
    excludeId?: Types.ObjectId,
  ): Promise<HydratedDocument<Category> | null> {
    const filter: FilterQuery<Category> = {
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
      isDeleted: false,
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return CategoryModel.findOne(filter).exec();
  }

  public async findActiveTreeCategories(): Promise<
    Array<HydratedDocument<Category>>
  > {
    return CategoryModel.find({ isActive: true, isDeleted: false })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  public async findAdminList(): Promise<Array<HydratedDocument<Category>>> {
    return CategoryModel.find({ isDeleted: false })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  public async findByIdIncludingDeleted(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Category> | null> {
    return CategoryModel.findById(id).exec();
  }

  public async hasChildren(parentId: Types.ObjectId): Promise<boolean> {
    const child = await CategoryModel.exists({
      parentCategory: parentId,
      isDeleted: false,
    }).exec();

    return Boolean(child);
  }

  public async updateById(
    id: Types.ObjectId,
    update: UpdateQuery<Category>,
  ): Promise<HydratedDocument<Category> | null> {
    return this.update({ _id: id }, update);
  }
}

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
