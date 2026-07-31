import mongoose from "mongoose";

import { OrderModel } from "../../order/index.js";
import { ProductModel } from "../../product/index.js";
import { UserModel } from "../../user/index.js";

export class PlatformRepository {
  public async getSystemMetrics(): Promise<{
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    databaseLatencyMs: number;
  }> {
    const startPing = Date.now();

    const [totalUsers, totalProducts, totalOrders, revenueResult] = await Promise.all([
      UserModel.countDocuments().exec(),
      ProductModel.countDocuments({ isDeleted: false }).exec(),
      OrderModel.countDocuments().exec(),
      OrderModel.aggregate([
        {
          $match: {
            orderStatus: { $in: ["CONFIRMED", "PREPARING", "READY", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]).exec(),
    ]);

    const databaseLatencyMs = Date.now() - startPing;
    const totalRevenue = revenueResult[0]?.totalRevenue ?? 0;

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      databaseLatencyMs,
    };
  }

  public isDatabaseConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}
