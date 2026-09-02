import { Router } from "express";

import { optionalAuth, requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { CartController } from "../controller/index.js";
import { CartRepository } from "../repository/index.js";
import { CartService } from "../service/index.js";
import {
  addCartItemSchema,
  cartItemIdParamSchema,
  customerIdParamSchema,
  mergeCartSchema,
  updateCartItemSchema,
} from "../validators/index.js";

export const cartRouter = Router();

cartRouter.use(optionalAuth);

const cartRepository = new CartRepository();
const cartService = new CartService(cartRepository);
const cartController = new CartController(cartService);
const ownerOnly = [requireAuth, requireRoles(["admin"])] as const;

cartRouter.get("/", asyncHandler(cartController.getCart));

cartRouter.post(
  "/items",
  validateRequest({ body: addCartItemSchema }),
  asyncHandler(cartController.addItem),
);

cartRouter.patch(
  "/items/:itemId",
  validateRequest({
    params: cartItemIdParamSchema,
    body: updateCartItemSchema,
  }),
  asyncHandler(cartController.updateItem),
);

cartRouter.delete(
  "/items/:itemId",
  validateRequest({ params: cartItemIdParamSchema }),
  asyncHandler(cartController.removeItem),
);

cartRouter.delete("/", asyncHandler(cartController.clearCart));

cartRouter.post(
  "/merge",
  requireAuth,
  validateRequest({ body: mergeCartSchema }),
  asyncHandler(cartController.mergeCart),
);

cartRouter.post("/coupon", asyncHandler(cartController.applyCoupon));
cartRouter.delete("/coupon", asyncHandler(cartController.removeCoupon));

cartRouter.get(
  "/admin/customer/:customerId",
  ...ownerOnly,
  validateRequest({ params: customerIdParamSchema }),
  asyncHandler(cartController.getCustomerCartByAdmin),
);

cartRouter.delete(
  "/admin/customer/:customerId",
  ...ownerOnly,
  validateRequest({ params: customerIdParamSchema }),
  asyncHandler(cartController.clearCustomerCartByAdmin),
);
