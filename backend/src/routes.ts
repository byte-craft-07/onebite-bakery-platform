import { Router } from "express";

import {
  addressRouter,
  authRouter,
  cartRouter,
  categoryRouter,
  checkoutRouter,
  favoriteRouter,
  mediaRouter,
  notificationRouter,
  occasionRouter,
  orderRouter,
  paymentRouter,
  platformHealthRouter,
  platformRouter,
  productRouter,
  reviewRouter,
  searchRouter,
  settingsRouter,
  uploadRouter,
  userRouter,
  villageRouter,
  couponRouter,
  branchRouter,
  customCakeRouter,
  comboRouter,
  bannerRouter,
} from "./modules/index.js";

import { deliveryAgentRouter } from "./modules/delivery/routes/delivery-agent.routes.js";
import { requireAuth, requireRoles } from "./modules/auth/index.js";
import { asyncHandler } from "./shared/utils/async-handler.js";
import { ROUTES } from "./shared/constants/routes.js";

export const apiRoutes = Router();

apiRoutes.use(ROUTES.AUTH, authRouter);
apiRoutes.use(ROUTES.USER, userRouter);
apiRoutes.use(ROUTES.ADDRESS, addressRouter);
apiRoutes.use(ROUTES.VILLAGE, villageRouter);
apiRoutes.use(ROUTES.PRODUCT, productRouter);
apiRoutes.use(ROUTES.CATEGORY, categoryRouter);
apiRoutes.use(ROUTES.OCCASION, occasionRouter);
apiRoutes.use(ROUTES.MEDIA, mediaRouter);
apiRoutes.use(ROUTES.NOTIFICATION, notificationRouter);
apiRoutes.use(ROUTES.CART, cartRouter);
apiRoutes.use(ROUTES.CHECKOUT, checkoutRouter);
apiRoutes.use(ROUTES.ORDER, orderRouter);
apiRoutes.use("/admin/orders", orderRouter);
apiRoutes.use(ROUTES.PAYMENT, paymentRouter);
apiRoutes.use(ROUTES.PLATFORM, platformRouter);
apiRoutes.use(ROUTES.REVIEW, reviewRouter);
apiRoutes.use(ROUTES.FAVORITE, favoriteRouter);
apiRoutes.use(ROUTES.SETTINGS, settingsRouter);
apiRoutes.use(ROUTES.UPLOAD, uploadRouter);
apiRoutes.use(ROUTES.SEARCH, searchRouter);
apiRoutes.use(ROUTES.HEALTH, platformHealthRouter);
apiRoutes.use(ROUTES.COUPONS, couponRouter);
apiRoutes.use(ROUTES.BRANCH, branchRouter);
apiRoutes.use(ROUTES.DELIVERY_AGENT, deliveryAgentRouter);
apiRoutes.use(ROUTES.CUSTOM_CAKE, customCakeRouter);
apiRoutes.use(ROUTES.COMBOS, comboRouter);
apiRoutes.use(ROUTES.BANNER, bannerRouter);

// Admin-only on-demand baseline seeding
apiRoutes.post(
  "/system/seed",
  requireAuth,
  requireRoles(["admin"]),
  asyncHandler(async (_req, res) => {
    const { seedInitialData } = await import("./db/seed.js");
    await seedInitialData(true);
    res.json({ success: true, message: "Baseline system data seeded successfully." });
  }),
);


