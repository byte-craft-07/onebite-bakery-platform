import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { cacheResponse, invalidateCache } from "../../../shared/middlewares/cache.middleware.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { publicProductQuerySchema } from "../../product/validators/index.js";
import { OccasionController } from "../controller/occasion.controller.js";
import { OccasionRepository } from "../repository/occasion.repository.js";
import { OccasionService } from "../service/occasion.service.js";
import {
  createOccasionSchema,
  occasionIdParamSchema,
  occasionSlugParamSchema,
  updateOccasionSchema,
} from "../validators/occasion.validators.js";

export const occasionRouter = Router();

const occasionRepository = new OccasionRepository();
const occasionService = new OccasionService(occasionRepository);
const occasionController = new OccasionController(occasionService);
const ownerOnly = [requireAuth, requireRoles(["admin"])] as const;

occasionRouter.get(
  "/",
  cacheResponse({ ttlSeconds: 600, tags: ["occasions"] }),
  asyncHandler(occasionController.listPublic),
);

occasionRouter.get(
  "/admin",
  ...ownerOnly,
  asyncHandler(occasionController.listAdmin),
);

occasionRouter.post(
  "/",
  ...ownerOnly,
  validateRequest({ body: createOccasionSchema }),
  invalidateCache(["occasions"]),
  asyncHandler(occasionController.create),
);

occasionRouter.patch(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: occasionIdParamSchema, body: updateOccasionSchema }),
  invalidateCache(["occasions"]),
  asyncHandler(occasionController.update),
);

occasionRouter.delete(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: occasionIdParamSchema }),
  invalidateCache(["occasions"]),
  asyncHandler(occasionController.softDelete),
);

occasionRouter.get(
  "/:slug",
  validateRequest({ params: occasionSlugParamSchema }),
  cacheResponse({ ttlSeconds: 600, tags: ["occasions"] }),
  asyncHandler(occasionController.getBySlug),
);

occasionRouter.get(
  "/:slug/products",
  validateRequest({
    params: occasionSlugParamSchema,
    query: publicProductQuerySchema,
  }),
  cacheResponse({ ttlSeconds: 300, tags: ["occasions", "products"] }),
  asyncHandler(occasionController.listProductsBySlug),
);
