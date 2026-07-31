import { Router } from "express";

import {
  addressRouter,
  authRouter,
  cartRouter,
  categoryRouter,
  checkoutRouter,
  favoriteRouter,
  healthRouter,
  occasionRouter,
  orderRouter,
  productRouter,
  reviewRouter,
  searchRouter,
  settingsRouter,
  uploadRouter,
  userRouter,
} from "./modules/index.js";
import { ROUTES } from "./shared/constants/routes.js";

export const apiRoutes = Router();

apiRoutes.use(ROUTES.AUTH, authRouter);
apiRoutes.use(ROUTES.USER, userRouter);
apiRoutes.use(ROUTES.ADDRESS, addressRouter);
apiRoutes.use(ROUTES.PRODUCT, productRouter);
apiRoutes.use(ROUTES.CATEGORY, categoryRouter);
apiRoutes.use(ROUTES.OCCASION, occasionRouter);
apiRoutes.use(ROUTES.MEDIA, uploadRouter);
apiRoutes.use(ROUTES.CART, cartRouter);
apiRoutes.use(ROUTES.CHECKOUT, checkoutRouter);
apiRoutes.use(ROUTES.ORDER, orderRouter);
apiRoutes.use(ROUTES.REVIEW, reviewRouter);
apiRoutes.use(ROUTES.FAVORITE, favoriteRouter);
apiRoutes.use(ROUTES.SETTINGS, settingsRouter);
apiRoutes.use(ROUTES.UPLOAD, uploadRouter);
apiRoutes.use(ROUTES.SEARCH, searchRouter);
apiRoutes.use(ROUTES.HEALTH, healthRouter);
