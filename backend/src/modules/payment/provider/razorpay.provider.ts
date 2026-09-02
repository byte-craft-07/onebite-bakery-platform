import crypto from "node:crypto";

import { env } from "../../../config/env.js";
import type {
  CreateProviderOrderResult,
  IPaymentProvider,
} from "./payment-provider.interface.js";

interface RazorpayOrderApiResponse {
  id?: unknown;
  amount?: unknown;
  currency?: unknown;
}

export class RazorpayProvider implements IPaymentProvider {
  public readonly providerName = "RAZORPAY";

  private readonly keyId: string;
  private readonly keySecret: string;

  public constructor() {
    this.keyId = env.razorpayKeyId ?? "";
    this.keySecret = env.razorpayKeySecret ?? "";
  }

  public async createOrder(
    amount: number,
    currency = "INR",
    receipt: string,
  ): Promise<CreateProviderOrderResult> {
    const amountInPaise = Math.round(amount * 100);

    if (this.keyId && this.keySecret) {
      return this.createOrderViaRestApi(amountInPaise, currency, receipt);
    }

    if (env.nodeEnv === "production") {
      throw new Error("Razorpay is not configured.");
    }

    const randomHex = crypto.randomBytes(4).toString("hex");
    const providerOrderId = `rzp_local_${receipt.replace(/[^a-zA-Z0-9]/g, "")}_${randomHex}`.slice(0, 40);

    return {
      providerOrderId,
      amount,
      currency,
      isMock: true,
    };
  }

  private async createOrderViaRestApi(
    amountInPaise: number,
    currency: string,
    receipt: string,
  ): Promise<CreateProviderOrderResult> {
    const authToken = Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
      "base64",
    );
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: receipt.slice(0, 40),
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay order API failed with status ${response.status}.`);
    }

    const order = (await response.json()) as RazorpayOrderApiResponse;

    if (
      typeof order.id !== "string" ||
      !order.id.startsWith("order_") ||
      typeof order.amount !== "number" ||
      typeof order.currency !== "string"
    ) {
      throw new Error("Razorpay order API returned an invalid order.");
    }

    return {
      providerOrderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      isMock: false,
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

    if (
      env.nodeEnv !== "production" &&
      orderId.startsWith("rzp_local_") &&
      paymentId.startsWith("pay_local_") &&
      signature === "development-mock-signature"
    ) {
      return true;
    }

    if (!this.keySecret) {
      return false;
    }

    try {
      const payload = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(payload)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
      const signatureBuffer = Buffer.from(signature, "utf-8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
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

      const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
      const signatureBuffer = Buffer.from(signature, "utf-8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (_err) {
      return false;
    }
  }

  public getKeyId(): string {
    return this.keyId;
  }
}
