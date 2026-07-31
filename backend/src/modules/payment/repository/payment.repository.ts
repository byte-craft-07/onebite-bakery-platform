import type { HydratedDocument, Types } from "mongoose";

import { BaseRepository } from "../../../db/base.repository.js";
import type { PaymentRecordStatus } from "../constants/index.js";
import { PaymentModel, type Payment } from "../model/index.js";

export class PaymentRepository extends BaseRepository<Payment> {
  public constructor() {
    super(PaymentModel);
  }

  public async findByOrder(
    orderId: Types.ObjectId,
  ): Promise<HydratedDocument<Payment> | null> {
    return PaymentModel.findOne({ orderId }).sort({ createdAt: -1 }).exec();
  }

  public async findByProviderOrder(
    providerOrderId: string,
  ): Promise<HydratedDocument<Payment> | null> {
    return PaymentModel.findOne({ providerOrderId }).exec();
  }

  public async findByProviderPayment(
    providerPaymentId: string,
  ): Promise<HydratedDocument<Payment> | null> {
    return PaymentModel.findOne({ providerPaymentId }).exec();
  }

  public async updateStatus(
    paymentId: Types.ObjectId,
    paymentStatus: PaymentRecordStatus,
    extraData: Partial<Payment> = {},
  ): Promise<HydratedDocument<Payment> | null> {
    return PaymentModel.findByIdAndUpdate(
      paymentId,
      { $set: { paymentStatus, ...extraData } },
      { new: true },
    ).exec();
  }
}
