import { Router } from "express";

import { requireAuth } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
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
  asyncHandler(async (req, res) => {
    const { amount, currency, receipt } = req.body;
    const amountInRupees = (amount || 49900) / 100;

    const orderResult = await razorpayProvider.createOrder(
      amountInRupees,
      currency || "INR",
      receipt || `receipt_${Date.now()}`,
    );

    res.json({
      id: orderResult.providerOrderId,
      amount: orderResult.amount * 100,
      currency: orderResult.currency,
      receipt: receipt || `receipt_${Date.now()}`,
      status: "created",
    });
  }),
);

paymentRouter.post(
  "/razorpay/verify",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const isVerified = razorpayProvider.verifySignature(
      razorpay_order_id || "",
      razorpay_payment_id || "",
      razorpay_signature || "",
    );

    res.json({ verified: isVerified, message: "Razorpay HMAC SHA-256 signature verified" });
  }),
);

paymentRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: paymentIdParamSchema }),
  asyncHandler(paymentController.getPaymentDetails),
);

paymentRouter.post("/webhook", asyncHandler(paymentController.handleWebhook));
