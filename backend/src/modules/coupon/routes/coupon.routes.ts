import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { CouponController } from "../controller/coupon.controller.js";
import { CouponRepository } from "../repository/coupon.repository.js";
import { CouponService } from "../service/coupon.service.js";
import {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
} from "../dto/coupon.dto.js";

export const couponRouter = Router();

const couponRepository = new CouponRepository();
export const couponService = new CouponService(couponRepository);
const couponController = new CouponController(couponService);

const adminOnly = [requireAuth, requireRoles(["admin"])] as const;

// Customer / Public promo code validation
couponRouter.post(
  "/validate",
  validateRequest({ body: applyCouponSchema }),
  asyncHandler(couponController.validateCoupon),
);

// Admin Coupon Management
couponRouter.get("/", ...adminOnly, asyncHandler(couponController.getAllCoupons));

couponRouter.get("/:id", ...adminOnly, asyncHandler(couponController.getCouponById));

couponRouter.post(
  "/",
  ...adminOnly,
  validateRequest({ body: createCouponSchema }),
  asyncHandler(couponController.createCoupon),
);

couponRouter.patch(
  "/:id",
  ...adminOnly,
  validateRequest({ body: updateCouponSchema }),
  asyncHandler(couponController.updateCoupon),
);

couponRouter.patch(
  "/:id/toggle",
  ...adminOnly,
  asyncHandler(couponController.toggleCouponStatus),
);

couponRouter.delete(
  "/:id",
  ...adminOnly,
  asyncHandler(couponController.deleteCoupon),
);
