import type { HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import { OtpModel, type Otp, type OtpPurpose } from "../model/index.js";

interface CreateOtpChallengeData {
  phone: string;
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: Date;
  lastSentAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface RefreshOtpChallengeData {
  otpHash: string;
  expiresAt: Date;
  lastSentAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class OtpRepository extends BaseRepository<Otp> {
  public constructor() {
    super(OtpModel);
  }

  public async findLatestActiveChallenge(
    phone: string,
    purpose: OtpPurpose,
    now = new Date(),
  ): Promise<HydratedDocument<Otp> | null> {
    return OtpModel.findOne({
      phone,
      purpose,
      isUsed: false,
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .select("+otpHash")
      .exec();
  }

  public async createChallenge(
    data: CreateOtpChallengeData,
  ): Promise<HydratedDocument<Otp>> {
    return this.create({
      ...data,
      attempts: 0,
      resendCount: 0,
      isUsed: false,
    });
  }

  public async refreshChallenge(
    id: Types.ObjectId,
    data: RefreshOtpChallengeData,
  ): Promise<HydratedDocument<Otp> | null> {
    return OtpModel.findByIdAndUpdate(
      id,
      {
        $set: {
          otpHash: data.otpHash,
          expiresAt: data.expiresAt,
          lastSentAt: data.lastSentAt,
          attempts: 0,
          isUsed: false,
          ...(data.ipAddress ? { ipAddress: data.ipAddress } : {}),
          ...(data.userAgent ? { userAgent: data.userAgent } : {}),
        },
        $inc: { resendCount: 1 },
      },
      { new: true, runValidators: true },
    )
      .select("+otpHash")
      .exec();
  }

  public async incrementAttempts(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Otp> | null> {
    return OtpModel.findByIdAndUpdate(
      id,
      { $inc: { attempts: 1 } },
      { new: true, runValidators: true },
    )
      .select("+otpHash")
      .exec();
  }

  public async markUsed(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Otp> | null> {
    return OtpModel.findByIdAndUpdate(
      id,
      { $set: { isUsed: true } },
      { new: true, runValidators: true },
    ).exec();
  }
}
