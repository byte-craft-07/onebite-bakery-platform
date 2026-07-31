import crypto from "node:crypto";

import type {
  CreateProviderOrderResult,
  IPaymentProvider,
} from "./payment-provider.interface.js";

export class RazorpayProvider implements IPaymentProvider {
  public readonly providerName = "RAZORPAY";

  private readonly keyId: string;
  private readonly keySecret: string;

  public constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID ?? "rzp_test_mock_key_id";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET ?? "rzp_test_mock_secret_key";
  }

  public async createOrder(
    amount: number,
    currency = "INR",
    receipt: string,
  ): Promise<CreateProviderOrderResult> {
    // Generate standard Razorpay order format
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

    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8"),
    );
  }

  public verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!rawBody || !signature || !secret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8"),
    );
  }

  public getKeyId(): string {
    return this.keyId;
  }
}
