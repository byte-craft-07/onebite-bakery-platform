import type { FilterQuery, HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import type { OrderStatus, PaymentStatus } from "../constants/index.js";
import type { ListOrdersFilterDto } from "../dto/index.js";
import { OrderModel, type Order } from "../model/index.js";

export class OrderRepository extends BaseRepository<Order> {
  public constructor() {
    super(OrderModel);
  }

  public async createOrder(
    data: Partial<Order>,
  ): Promise<HydratedDocument<Order>> {
    return this.create(data);
  }

  public async findByOrderNumber(
    orderNumber: string,
  ): Promise<HydratedDocument<Order> | null> {
    return OrderModel.findOne({ orderNumber }).exec();
  }

  public async findCustomerOrders(
    customerId: Types.ObjectId,
    page = 1,
    limit = 20,
  ): Promise<{
    items: Array<HydratedDocument<Order>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Order> = {
      $or: [{ customerId }, { userId: customerId }],
    };

    const [items, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      OrderModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async updateStatus(
    orderId: Types.ObjectId,
    status: OrderStatus,
    cancellationReason?: string,
    cancelledBy?: Types.ObjectId,
  ): Promise<HydratedDocument<Order> | null> {
    const updateData: Record<string, unknown> = {
      orderStatus: status,
    };

    if (status === "CANCELLED") {
      updateData.cancellationReason =
        cancellationReason ?? "Order cancelled";
      if (cancelledBy) updateData.cancelledBy = cancelledBy;
      updateData.cancelledAt = new Date();
    }

    return OrderModel.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true },
    ).exec();
  }

  public async updatePaymentStatus(
    orderId: Types.ObjectId,
    paymentStatus: PaymentStatus,
  ): Promise<HydratedDocument<Order> | null> {
    return OrderModel.findByIdAndUpdate(
      orderId,
      { $set: { paymentStatus } },
      { new: true },
    ).exec();
  }

  public async findAllOrders(
    query: ListOrdersFilterDto,
  ): Promise<{
    items: Array<HydratedDocument<Order>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Order> = {};

    if (query.status) {
      filter.orderStatus = query.status;
    }

    if (query.customerId) {
      filter.customerId = query.customerId;
    }

    const [items, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      OrderModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
