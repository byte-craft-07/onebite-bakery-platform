import { Router } from "express";

import { requireAuth } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
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

paymentRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: paymentIdParamSchema }),
  asyncHandler(paymentController.getPaymentDetails),
);

paymentRouter.post("/webhook", asyncHandler(paymentController.handleWebhook));
