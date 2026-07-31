import type { HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { CartModel, type Cart, type CartItem } from "../model/index.js";

export class CartRepository extends BaseRepository<Cart> {
  public constructor() {
    super(CartModel);
  }

  public async findActiveCart(
    userId: Types.ObjectId,
  ): Promise<HydratedDocument<Cart> | null> {
    return CartModel.findOne({
      $or: [{ userId }, { customerId: userId }],
    }).exec();
  }

  public async findByCustomerId(
    customerId: Types.ObjectId,
  ): Promise<HydratedDocument<Cart> | null> {
    return this.findActiveCart(customerId);
  }

  public async findBySessionId(
    sessionId: string,
  ): Promise<HydratedDocument<Cart> | null> {
    return CartModel.findOne({ sessionId }).exec();
  }

  public async createCart(
    userId: Types.ObjectId,
  ): Promise<HydratedDocument<Cart>> {
    const cart = new CartModel({
      userId,
      customerId: userId,
      items: [],
      totalItems: 0,
      subtotal: 0,
    });
    await cart.save();
    return cart;
  }

  public async addItem(
    cartId: Types.ObjectId,
    item: CartItem,
  ): Promise<HydratedDocument<Cart> | null> {
    return CartModel.findByIdAndUpdate(
      cartId,
      { $push: { items: item } },
      { new: true },
    ).exec();
  }

  public async updateItem(
    cartId: Types.ObjectId,
    itemId: Types.ObjectId,
    quantity: number,
    notes?: string,
  ): Promise<HydratedDocument<Cart> | null> {
    const updateQuery: Record<string, unknown> = {
      "items.$.quantity": quantity,
      "items.$.totalPrice": quantity,
    };

    if (notes !== undefined) {
      updateQuery["items.$.notes"] = notes;
    }

    return CartModel.findOneAndUpdate(
      { _id: cartId, "items._id": itemId },
      { $set: updateQuery },
      { new: true },
    ).exec();
  }

  public async removeItem(
    cartId: Types.ObjectId,
    itemId: Types.ObjectId,
  ): Promise<HydratedDocument<Cart> | null> {
    return CartModel.findByIdAndUpdate(
      cartId,
      { $pull: { items: { _id: itemId } } },
      { new: true },
    ).exec();
  }

  public async clearCart(
    cartId: Types.ObjectId,
  ): Promise<HydratedDocument<Cart> | null> {
    return CartModel.findByIdAndUpdate(
      cartId,
      {
        $set: {
          items: [],
          totalItems: 0,
          subtotal: 0,
          grandTotal: 0,
          estimatedDiscount: 0,
          estimatedTax: 0,
          estimatedDeliveryCharge: 0,
        },
      },
      { new: true },
    ).exec();
  }

  public async deleteByCustomerId(customerId: Types.ObjectId): Promise<boolean> {
    const result = await CartModel.deleteOne({
      $or: [{ userId: customerId }, { customerId }],
    }).exec();
    return result.deletedCount > 0;
  }

  public async deleteBySessionId(sessionId: string): Promise<boolean> {
    const result = await CartModel.deleteOne({ sessionId }).exec();
    return result.deletedCount > 0;
  }
}
