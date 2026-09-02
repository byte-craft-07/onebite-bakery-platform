import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { cacheResponse, invalidateCache } from "../../../shared/middlewares/cache.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { bannerController } from "../controller/banner.controller.js";

export const bannerRouter = Router();
const adminOnly = [requireAuth, requireRoles(["admin"])] as const;

// Public active banners
bannerRouter.get(
  "/",
  cacheResponse({ ttlSeconds: 600, tags: ["banners"] }),
  asyncHandler(bannerController.getActiveBanners),
);

// Admin routes
bannerRouter.get("/admin", ...adminOnly, asyncHandler(bannerController.getAllBannersAdmin));
bannerRouter.get("/:id", asyncHandler(bannerController.getBannerById));
bannerRouter.post("/", ...adminOnly, invalidateCache(["banners"]), asyncHandler(bannerController.createBanner));
bannerRouter.put("/:id", ...adminOnly, invalidateCache(["banners"]), asyncHandler(bannerController.updateBanner));
bannerRouter.delete("/:id", ...adminOnly, invalidateCache(["banners"]), asyncHandler(bannerController.deleteBanner));
bannerRouter.patch("/:id/status", ...adminOnly, invalidateCache(["banners"]), asyncHandler(bannerController.toggleStatus));
bannerRouter.patch("/reorder", ...adminOnly, invalidateCache(["banners"]), asyncHandler(bannerController.reorderBanners));
