import type {
  FilterQuery,
  HydratedDocument,
  Types,
  UpdateQuery,
} from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { CategoryModel } from "../../category/index.js";
import { OccasionModel } from "../../occasion/index.js";
import { ProductModel, type Product } from "../model/index.js";

export class ProductRepository extends BaseRepository<Product> {
  public constructor() {
    super(ProductModel);
  }

  public async findBySlug(
    slug: string,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findOne({ slug }).exec();
  }

  public async findActiveBySlug(
    slug: string,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findOne({
      slug,
      isActive: true,
      isDeleted: false,
    }).exec();
  }

  public async findPublicList(): Promise<Array<HydratedDocument<Product>>> {
    return ProductModel.find({ isActive: true, isDeleted: false })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  public async findAdminList(): Promise<Array<HydratedDocument<Product>>> {
    return ProductModel.find({ isDeleted: false })
      .sort({ displayOrder: 1, name: 1 })
      .exec();
  }

  public async findByIdIncludingDeleted(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findById(id).exec();
  }

  public async updateById(
    id: Types.ObjectId,
    update: UpdateQuery<Product>,
  ): Promise<HydratedDocument<Product> | null> {
    return this.update({ _id: id }, update);
  }

  public async categoryExists(categoryId: Types.ObjectId): Promise<boolean> {
    const category = await CategoryModel.exists({
      _id: categoryId,
      isDeleted: false,
    }).exec();

    return Boolean(category);
  }

  public async findMissingOccasionIds(
    occasionIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    if (occasionIds.length === 0) {
      return [];
    }

    const occasions = await OccasionModel.find({
      _id: { $in: occasionIds },
    })
      .select("_id")
      .exec();
    const foundIds = new Set(occasions.map((occasion) => occasion._id.toString()));

    return occasionIds.filter((occasionId) => !foundIds.has(occasionId.toString()));
  }

  public async findExistingProduct(
    filter: FilterQuery<Product>,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findOne(filter).exec();
  }
}
