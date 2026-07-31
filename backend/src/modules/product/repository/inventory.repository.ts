import type { HydratedDocument, Types, UpdateQuery } from "mongoose";

import { ProductModel, type Product } from "../model/index.js";

export class InventoryRepository {
  public async findByIdWithPrivatePricing(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findOne({ _id: id, isDeleted: false })
      .select("+costPrice")
      .exec();
  }

  public async updateProductInventory(
    id: Types.ObjectId,
    update: UpdateQuery<Product>,
  ): Promise<HydratedDocument<Product> | null> {
    return ProductModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      update,
      { new: true, runValidators: true },
    )
      .select("+costPrice")
      .exec();
  }

  public async findMissingProductIds(
    productIds: Types.ObjectId[],
  ): Promise<Types.ObjectId[]> {
    if (productIds.length === 0) {
      return [];
    }

    const products = await ProductModel.find({
      _id: { $in: productIds },
      isDeleted: false,
    })
      .select("_id")
      .exec();
    const foundIds = new Set(products.map((product) => product._id.toString()));

    return productIds.filter((productId) => !foundIds.has(productId.toString()));
  }
}
