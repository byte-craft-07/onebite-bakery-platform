import { Router } from "express";
import { z } from "zod";

import { env } from "../../../config/env.js";
import { requireAuth } from "../../auth/index.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { logger } from "../../../shared/utils/logger.js";
import { PaymentController } from "../controller/index.js";
import { PaymentRepository } from "../repository/index.js";
import { PaymentService } from "../service/index.js";
import { RazorpayProvider } from "../provider/razorpay.provider.js";
import {
  createPaymentSchema,
  paymentIdParamSchema,
  verifyPaymentSchema,
} from "../validators/index.js";

export const paymentRouter = Router();

const paymentRepository = new PaymentRepository();
const paymentService = new PaymentService(paymentRepository);
const paymentController = new PaymentController(paymentService);
const razorpayProvider = new RazorpayProvider();

const razorpayCreateOrderSchema = z.object({
  amount: z.number().int().min(100),
  currency: z.literal("INR").default("INR"),
  receipt: z.string().trim().min(1).max(40),
});

const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().trim().min(5),
  razorpay_payment_id: z.string().trim().min(5),
  razorpay_signature: z.string().trim().min(10),
});

paymentRouter.post(
  "/create",
  requireAuth,
  validateRequest({ body: createPaymentSchema }),
  asyncHandler(paymentController.createPayment),
);

paymentRouter.post(
  "/verify",
  requireAuth,
  validateRequest({ body: verifyPaymentSchema }),
  asyncHandler(paymentController.verifyPayment),
);

// Razorpay Direct Integration Endpoints (Real Razorpay API Call)
paymentRouter.post(
  "/razorpay/create-order",
  requireAuth,
  validateRequest({ body: razorpayCreateOrderSchema }),
  asyncHandler(async (req, res) => {
    const { amount, currency, receipt } = req.body as z.infer<typeof razorpayCreateOrderSchema>;
    const amountInRupees = amount / 100;

    try {
      const orderResult = await razorpayProvider.createOrder(
        amountInRupees,
        currency,
        receipt,
      );

      res.json({
        id: orderResult.providerOrderId,
        amount: Math.round(orderResult.amount * 100),
        currency: orderResult.currency,
        receipt,
        status: "created",
        isMock: orderResult.isMock,
        keyId: env.razorpayKeyId,
      });
    } catch (error) {
      logger.error(
        {
          error,
          provider: "RAZORPAY",
          receipt,
          hasKeyId: Boolean(env.razorpayKeyId),
          hasKeySecret: Boolean(env.razorpayKeySecret),
        },
        "Razorpay order creation failed",
      );

      throw new AppError(
        "Unable to create Razorpay order.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_GATEWAY_ERROR,
      );
    }
  }),
);

paymentRouter.post(
  "/razorpay/verify",
  requireAuth,
  validateRequest({ body: razorpayVerifySchema }),
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body as z.infer<typeof razorpayVerifySchema>;
    const isVerified = razorpayProvider.verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!isVerified) {
      throw new AppError(
        "Payment verification failed.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_INVALID_SIGNATURE,
      );
    }

    res.json({ verified: true, message: "Razorpay HMAC SHA-256 signature verified" });
  }),
);

paymentRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: paymentIdParamSchema }),
  asyncHandler(paymentController.getPaymentDetails),
);

paymentRouter.post("/webhook", asyncHandler(paymentController.handleWebhook));
