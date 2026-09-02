import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { cacheResponse, invalidateCache } from "../../../shared/middlewares/cache.middleware.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { publicProductQuerySchema } from "../../product/validators/index.js";
import { CategoryController } from "../controller/index.js";
import { CategoryRepository } from "../repository/index.js";
import { CategoryService } from "../service/index.js";
import {
  categoryIdParamSchema,
  createCategorySchema,
  reorderCategoriesSchema,
  updateCategorySchema,
} from "../validators/index.js";

export const categoryRouter = Router();

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);
const ownerOnly = [requireAuth, requireRoles(["admin"])] as const;

categoryRouter.get(
  "/",
  cacheResponse({ ttlSeconds: 600, tags: ["categories"] }),
  asyncHandler(categoryController.listPublic),
);

categoryRouter.get(
  "/admin",
  ...ownerOnly,
  asyncHandler(categoryController.listAdmin),
);

categoryRouter.get(
  "/:slug/products",
  validateRequest({ query: publicProductQuerySchema }),
  cacheResponse({ ttlSeconds: 300, tags: ["categories", "products"] }),
  asyncHandler(categoryController.listProductsBySlug),
);

categoryRouter.patch(
  "/reorder",
  ...ownerOnly,
  validateRequest({ body: reorderCategoriesSchema }),
  invalidateCache(["categories"]),
  asyncHandler(categoryController.reorder),
);

categoryRouter.post(
  "/",
  ...ownerOnly,
  validateRequest({ body: createCategorySchema }),
  invalidateCache(["categories"]),
  asyncHandler(categoryController.create),
);

categoryRouter.get(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: categoryIdParamSchema }),
  asyncHandler(categoryController.getById),
);

categoryRouter.patch(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: categoryIdParamSchema, body: updateCategorySchema }),
  invalidateCache(["categories"]),
  asyncHandler(categoryController.update),
);

categoryRouter.delete(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: categoryIdParamSchema }),
  invalidateCache(["categories"]),
  asyncHandler(categoryController.softDelete),
);

categoryRouter.patch(
  "/:id/restore",
  ...ownerOnly,
  validateRequest({ params: categoryIdParamSchema }),
  invalidateCache(["categories"]),
  asyncHandler(categoryController.restore),
);
