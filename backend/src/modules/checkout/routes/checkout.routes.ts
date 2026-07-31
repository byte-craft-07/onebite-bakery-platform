import { Router } from "express";

import { requireAuth } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { CartRepository } from "../../cart/index.js";
import { CheckoutController } from "../controller/index.js";
import { CheckoutService } from "../service/index.js";
import {
  checkoutPreviewQuerySchema,
  validateCheckoutSchema,
} from "../validators/index.js";

export const checkoutRouter = Router();

const cartRepository = new CartRepository();
const checkoutService = new CheckoutService(cartRepository);
const checkoutController = new CheckoutController(checkoutService);

checkoutRouter.get(
  "/",
  requireAuth,
  validateRequest({ query: checkoutPreviewQuerySchema }),
  asyncHandler(checkoutController.getSummary),
);

checkoutRouter.post(
  "/validate",
  requireAuth,
  validateRequest({ body: validateCheckoutSchema }),
  asyncHandler(checkoutController.validate),
);
