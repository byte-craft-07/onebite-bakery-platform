import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { businessHubController } from "../controller/business-hub.controller.js";
import {
  createBusinessLinkSchema,
  reorderLinksSchema,
  trackEventSchema,
  updateAppearanceSchema,
  updateBusinessHoursSchema,
  updateBusinessLinkSchema,
  updateBusinessProfileSchema,
  updateLocationSchema,
  updateSeoSchema,
  updateSocialSchema,
} from "../validators/business-hub.validators.js";

export const businessHubRouter = Router();
const adminOnly = [requireAuth, requireRoles(["admin"])] as const;

// ── Public Routes ──
businessHubRouter.get(
  "/",
  asyncHandler(businessHubController.getPublicHub),
);

businessHubRouter.post(
  "/track",
  validateRequest({ body: trackEventSchema }),
  asyncHandler(businessHubController.trackEvent),
);

businessHubRouter.post(
  "/links/:id/click",
  asyncHandler(businessHubController.trackLinkClick),
);

// ── Admin Routes ──
businessHubRouter.get(
  "/admin",
  ...adminOnly,
  asyncHandler(businessHubController.getAdminHub),
);

businessHubRouter.put(
  "/admin/profile",
  ...adminOnly,
  validateRequest({ body: updateBusinessProfileSchema }),
  asyncHandler(businessHubController.updateProfile),
);

businessHubRouter.post(
  "/admin/links",
  ...adminOnly,
  validateRequest({ body: createBusinessLinkSchema }),
  asyncHandler(businessHubController.createLink),
);

businessHubRouter.put(
  "/admin/links/reorder",
  ...adminOnly,
  validateRequest({ body: reorderLinksSchema }),
  asyncHandler(businessHubController.reorderLinks),
);

businessHubRouter.post(
  "/admin/links/reset-defaults",
  ...adminOnly,
  asyncHandler(businessHubController.resetDefaultLinks),
);

businessHubRouter.put(
  "/admin/links/:id",
  ...adminOnly,
  validateRequest({ body: updateBusinessLinkSchema }),
  asyncHandler(businessHubController.updateLink),
);

businessHubRouter.delete(
  "/admin/links/:id",
  ...adminOnly,
  asyncHandler(businessHubController.deleteLink),
);

businessHubRouter.patch(
  "/admin/links/:id/status",
  ...adminOnly,
  asyncHandler(businessHubController.toggleLinkStatus),
);

businessHubRouter.post(
  "/admin/links/:id/duplicate",
  ...adminOnly,
  asyncHandler(businessHubController.duplicateLink),
);

businessHubRouter.put(
  "/admin/hours",
  ...adminOnly,
  validateRequest({ body: updateBusinessHoursSchema }),
  asyncHandler(businessHubController.updateBusinessHours),
);

businessHubRouter.put(
  "/admin/social",
  ...adminOnly,
  validateRequest({ body: updateSocialSchema }),
  asyncHandler(businessHubController.updateSocial),
);

businessHubRouter.put(
  "/admin/location",
  ...adminOnly,
  validateRequest({ body: updateLocationSchema }),
  asyncHandler(businessHubController.updateLocation),
);

businessHubRouter.put(
  "/admin/appearance",
  ...adminOnly,
  validateRequest({ body: updateAppearanceSchema }),
  asyncHandler(businessHubController.updateAppearance),
);

businessHubRouter.put(
  "/admin/seo",
  ...adminOnly,
  validateRequest({ body: updateSeoSchema }),
  asyncHandler(businessHubController.updateSeo),
);

businessHubRouter.get(
  "/admin/analytics",
  ...adminOnly,
  asyncHandler(businessHubController.getAnalytics),
);
