import { Router } from "express";
import { z } from "zod";

import { env } from "../../../config/env.js";
import { requireAuth, type AuthenticatedRequest } from "../../auth/index.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { logger } from "../../../shared/utils/logger.js";
import { PaymentController } from "../controller/index.js";
import { PaymentRepository } from "../repository/index.js";
import { PaymentService } from "../service/index.js";
import {
  createPaymentSchema,
  paymentIdParamSchema,
  verifyPaymentSchema,
} from "../validators/index.js";

export const paymentRouter = Router();

const paymentRepository = new PaymentRepository();
const paymentService = new PaymentService(paymentRepository);
const paymentController = new PaymentController(paymentService);

const razorpayCreateOrderSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order id."),
});

const razorpayVerifySchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order id."),
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
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.id;

    if (!userId) {
      throw new AppError(
        "Authentication required.",
        HTTP_STATUS.UNAUTHORIZED,
        [],
        true,
        APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
      );
    }

    const { orderId } = req.body as z.infer<typeof razorpayCreateOrderSchema>;

    try {
      const orderResult = await paymentService.createPayment(userId, {
        orderId,
        provider: "RAZORPAY",
      });

      res.json({
        id: orderResult.providerOrderId,
        amount: Math.round(orderResult.amount * 100),
        currency: orderResult.currency,
        receipt: orderResult.orderId,
        status: "created",
        isMock: !orderResult.providerOrderId.startsWith("order_"),
        keyId: orderResult.razorpayKeyId,
        paymentId: orderResult.paymentId,
        orderId: orderResult.orderId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(
        {
          error,
          provider: "RAZORPAY",
          orderId,
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
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.id;

    if (!userId) {
      throw new AppError(
        "Authentication required.",
        HTTP_STATUS.UNAUTHORIZED,
        [],
        true,
        APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
      );
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body as z.infer<typeof razorpayVerifySchema>;
    const result = await paymentService.verifyPayment(userId, {
      orderId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    res.json({
      verified: result.success,
      paymentStatus: result.paymentStatus,
      message: result.message,
    });
  }),
);

paymentRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: paymentIdParamSchema }),
  asyncHandler(paymentController.getPaymentDetails),
);

paymentRouter.post("/webhook", asyncHandler(paymentController.handleWebhook));
