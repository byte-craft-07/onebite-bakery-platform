import type { HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { UserModel } from "../../user/model/user.model.js";
import {
  PushSubscriptionModel,
  type PushSubscription,
  type PushSubscriptionKeys,
} from "../model/index.js";

export class PushSubscriptionRepository extends BaseRepository<PushSubscription> {
  public constructor() {
    super(PushSubscriptionModel);
  }

  public async upsertSubscription(
    userId: Types.ObjectId,
    data: {
      endpoint: string;
      keys: PushSubscriptionKeys;
      deviceInfo?: Record<string, unknown>;
      userAgent?: string;
    },
  ): Promise<HydratedDocument<PushSubscription>> {
    const updated = await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: data.endpoint },
      {
        $set: {
          userId,
          keys: data.keys,
          ...(data.deviceInfo ? { deviceInfo: data.deviceInfo } : {}),
          ...(data.userAgent ? { userAgent: data.userAgent } : {}),
          isActive: true,
          lastUsedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    return updated as HydratedDocument<PushSubscription>;
  }

  public async findActiveByUserId(
    userId: Types.ObjectId,
  ): Promise<Array<HydratedDocument<PushSubscription>>> {
    return PushSubscriptionModel.find({
      userId,
      isActive: true,
    }).exec();
  }

  public async findActiveByUserIds(
    userIds: Types.ObjectId[],
  ): Promise<Array<HydratedDocument<PushSubscription>>> {
    return PushSubscriptionModel.find({
      userId: { $in: userIds },
      isActive: true,
    }).exec();
  }

  public async findAllActiveAdminSubscriptions(
    branchId?: Types.ObjectId,
  ): Promise<Array<HydratedDocument<PushSubscription>>> {
    // 1. Find all eligible admin and branch admin users
    const query: Record<string, unknown> = {
      role: { $in: ["admin", "branch_admin"] },
      status: "active",
    };

    if (branchId) {
      // If branch-specific order: all platform admins + branch admins for that branch
      query.$or = [
        { role: "admin" },
        { role: "branch_admin", branchId },
      ];
      delete query.role;
    }

    const eligibleUsers = await UserModel.find(query).select("_id").lean().exec();
    if (!eligibleUsers || eligibleUsers.length === 0) {
      return [];
    }

    const userIds = eligibleUsers.map((u) => u._id);
    return PushSubscriptionModel.find({
      userId: { $in: userIds },
      isActive: true,
    }).exec();
  }

  public async deactivateSubscription(
    endpoint: string,
  ): Promise<HydratedDocument<PushSubscription> | null> {
    return PushSubscriptionModel.findOneAndUpdate(
      { endpoint },
      { $set: { isActive: false } },
      { new: true },
    ).exec();
  }

  public async deleteByEndpoint(
    userId: Types.ObjectId,
    endpoint: string,
  ): Promise<boolean> {
    const result = await PushSubscriptionModel.deleteOne({
      userId,
      endpoint,
    }).exec();
    return result.deletedCount > 0;
  }
}
