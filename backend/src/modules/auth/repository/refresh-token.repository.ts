import type { HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import {
  RefreshTokenModel,
  type RefreshToken,
} from "../model/index.js";

interface CreateRefreshSessionData {
  userId: Types.ObjectId;
  tokenHash: string;
  deviceId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastUsedAt: Date;
}

export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  public constructor() {
    super(RefreshTokenModel);
  }

  public async createSession(
    data: CreateRefreshSessionData,
  ): Promise<HydratedDocument<RefreshToken>> {
    return this.create(data);
  }

  public async findActiveByHash(
    tokenHash: string,
    now = new Date(),
  ): Promise<HydratedDocument<RefreshToken> | null> {
    return RefreshTokenModel.findOne({
      tokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: now },
    })
      .select("+tokenHash")
      .exec();
  }

  public async revokeSession(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<RefreshToken> | null> {
    return RefreshTokenModel.findByIdAndUpdate(
      id,
      { $set: { revokedAt: new Date() } },
      { new: true, runValidators: true },
    ).exec();
  }

  public async rotateSession(
    oldSessionId: Types.ObjectId,
    newSessionId: Types.ObjectId,
  ): Promise<HydratedDocument<RefreshToken> | null> {
    return RefreshTokenModel.findByIdAndUpdate(
      oldSessionId,
      {
        $set: {
          revokedAt: new Date(),
          replacedByTokenId: newSessionId,
        },
      },
      { new: true, runValidators: true },
    ).exec();
  }

  public async touchSession(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<RefreshToken> | null> {
    return RefreshTokenModel.findByIdAndUpdate(
      id,
      { $set: { lastUsedAt: new Date() } },
      { new: true, runValidators: true },
    ).exec();
  }

  public async revokeAllForUser(userId: Types.ObjectId): Promise<number> {
    const result = await RefreshTokenModel.updateMany(
      {
        userId,
        revokedAt: { $exists: false },
      },
      { $set: { revokedAt: new Date() } },
      { runValidators: true },
    ).exec();

    return result.modifiedCount;
  }
}
