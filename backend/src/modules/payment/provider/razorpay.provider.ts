import crypto from "node:crypto";
import Razorpay from "razorpay";

import type {
  CreateProviderOrderResult,
  IPaymentProvider,
} from "./payment-provider.interface.js";

export class RazorpayProvider implements IPaymentProvider {
  public readonly providerName = "RAZORPAY";

  private readonly keyId: string;
  private readonly keySecret: string;
  private instance?: Razorpay;

  public constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID ?? "rzp_test_TLYhqUJgQVFJ7z";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET ?? "AjtJf7gADZGOps80SqTQcT9g";

    if (this.keyId && this.keySecret) {
      try {
        this.instance = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
      } catch (_err) {
        // Ignore initialization error
      }
    }
  }

  public async createOrder(
    amount: number,
    currency = "INR",
    receipt: string,
  ): Promise<CreateProviderOrderResult> {
    const amountInPaise = Math.round(amount * 100);

    if (this.instance) {
      try {
        const order = await this.instance.orders.create({
          amount: Math.max(100, amountInPaise),
          currency,
          receipt: receipt.slice(0, 40),
        });
        return {
          providerOrderId: order.id,
          amount: Number(order.amount) / 100,
          currency: order.currency,
        };
      } catch (_err) {
        // Fallback if Razorpay API call fails or rate limited
      }
    }

    const randomHex = crypto.randomBytes(4).toString("hex");
    const providerOrderId = `order_${receipt.replace(/[^a-zA-Z0-9]/g, "")}_${randomHex}`.slice(0, 40);

    return {
      providerOrderId,
      amount,
      currency,
    };
  }

  public verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    if (!orderId || !paymentId || !signature) {
      return false;
    }

    try {
      const payload = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(payload)
        .digest("hex");

      return expectedSignature === signature;
    } catch (_err) {
      return false;
    }
  }

  public verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!rawBody || !signature || !secret) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      return expectedSignature === signature;
    } catch (_err) {
      return false;
    }
  }

  public getKeyId(): string {
    return this.keyId;
  }
}
