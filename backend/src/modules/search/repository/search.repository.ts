import type { FilterQuery } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { ProductModel, type Product } from "../../product/index.js";

export class SearchRepository extends BaseRepository<Product> {
  public constructor() {
    super(ProductModel);
  }

  public async searchProducts(
    filter: FilterQuery<Product>,
    sortOption: Record<string, 1 | -1>,
    skip: number,
    limit: number,
  ) {
    return ProductModel.find(filter)
      .select("-costPrice -deletedAt -deletedBy -__v")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  public async countProducts(filter: FilterQuery<Product>): Promise<number> {
    return ProductModel.countDocuments(filter).exec();
  }
}
