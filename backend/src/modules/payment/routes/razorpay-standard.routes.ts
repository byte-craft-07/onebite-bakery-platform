import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import { env } from "../../../config/env.js";
import { logger } from "../../../shared/utils/logger.js";
import { OrderModel } from "../../order/model/order.model.js";
import { PaymentRepository } from "../repository/payment.repository.js";

export const razorpayStandardRouter = Router();
const paymentRepository = new PaymentRepository();

/**
 * STEP 1: Create Order
 * Endpoint: POST /api/create-order (or framework equivalent)
 * Calls Razorpay API: POST https://api.razorpay.com/v1/orders
 * Request: { amount (paise), currency, receipt }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
razorpayStandardRouter.post("/create-order", async (req: Request, res: Response) => {
  const { amount: rawAmount, currency: rawCurrency, receipt: rawReceipt } = req.body;

  // Validate amount >= 100 paise
  const amount = Number(rawAmount);
  if (!rawAmount || isNaN(amount) || amount < 100) {
    return res.status(400).json({
      success: false,
      error: "Amount must be at least 100 paise (₹1.00).",
      message: "Validation failed: amount must be a number >= 100 paise.",
    });
  }

  const keyId = env.razorpayKeyId;
  const keySecret = env.razorpayKeySecret;

  if (!keyId || !keySecret) {
    logger.error("Razorpay API keys not configured in backend environment");
    return res.status(500).json({
      success: false,
      error: "Razorpay credentials are not configured on server.",
      message: "Server environment missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.",
    });
  }

  const currency = (typeof rawCurrency === "string" ? rawCurrency.trim() : "INR").toUpperCase();
  const receipt = (typeof rawReceipt === "string" && rawReceipt.trim())
    ? rawReceipt.trim().slice(0, 40)
    : `rcpt_${Date.now()}`;

  try {
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency,
        receipt,
      }),
    });

    if (razorpayResponse.status === 401) {
      logger.error("Razorpay API authorization failed (401)");
      return res.status(401).json({
        success: false,
        error: "Razorpay authentication failed. Invalid API credentials.",
        message: "Razorpay key or secret is unauthorized.",
      });
    }

    if (!razorpayResponse.ok) {
      const errorBody = await razorpayResponse.json().catch(() => ({}));
      logger.error({ status: razorpayResponse.status, errorBody }, "Razorpay order creation failed");
      return res.status(500).json({
        success: false,
        error: "Razorpay order creation API error.",
        details: errorBody,
      });
    }

    const orderData = (await razorpayResponse.json()) as {
      id: string;
      amount: number;
      currency: string;
      receipt?: string;
      status?: string;
    };

    return res.status(200).json({
      order_id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      id: orderData.id,
      key_id: keyId,
      receipt: orderData.receipt,
      status: orderData.status,
    });
  } catch (error) {
    logger.error({ error }, "Error occurred while calling Razorpay API");
    return res.status(500).json({
      success: false,
      error: "Internal server error while creating Razorpay order.",
    });
  }
});

/**
 * STEP 3: Verify Payment Signature
 * Endpoint: POST /api/verify-payment (or framework equivalent)
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
razorpayStandardRouter.post("/verify-payment", async (req: Request, res: Response) => {
  const orderId = req.body.order_id || req.body.razorpay_order_id;
  const paymentId = req.body.payment_id || req.body.razorpay_payment_id;
  const signature = req.body.razorpay_signature || req.body.signature;

  // Validate missing fields
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: order_id, payment_id, and razorpay_signature are required.",
      message: "Payment verification aborted due to missing parameters.",
    });
  }

  const keySecret = env.razorpayKeySecret;
  if (!keySecret) {
    logger.error("RAZORPAY_KEY_SECRET missing in backend environment during signature verification");
    return res.status(500).json({
      success: false,
      error: "Server configuration error: missing Razorpay secret key.",
    });
  }

  try {
    const payload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(generatedSignature, "utf-8");
    const signatureBuffer = Buffer.from(String(signature), "utf-8");

    let isSignatureValid = false;
    if (expectedBuffer.length === signatureBuffer.length) {
      isSignatureValid = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    }

    if (!isSignatureValid) {
      logger.warn({ orderId, paymentId }, "Payment signature mismatch detected");
      return res.status(400).json({
        success: false,
        error: "Signature mismatch: payment verification failed.",
        message: "Payment signature is invalid.",
      });
    }

    // Attempt to update database order and payment records if database is connected
    try {
      const mongoose = await import("mongoose");
      if (mongoose.default.connection.readyState === 1) {
        const paymentRecord = await paymentRepository.findByProviderOrder(orderId);
        if (paymentRecord) {
          await paymentRepository.updateStatus(paymentRecord._id, "CAPTURED", {
            providerPaymentId: paymentId,
            paymentMethod: "UPI",
          });

          const associatedOrder = await OrderModel.findById(paymentRecord.orderId);
          if (associatedOrder && associatedOrder.paymentStatus !== "SUCCESS") {
            associatedOrder.paymentStatus = "SUCCESS";
            if (associatedOrder.orderStatus === "PENDING") {
              associatedOrder.orderStatus = "CONFIRMED";
            }
            await associatedOrder.save();
          }
        }
      }
    } catch (dbErr) {
      logger.warn({ error: dbErr }, "Database record update skipped or failed during payment verification");
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error) {
    logger.error({ error }, "Unexpected error in payment verification");
    return res.status(500).json({
      success: false,
      error: "Internal server error during payment verification.",
    });
  }
});
