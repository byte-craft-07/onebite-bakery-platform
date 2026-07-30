import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
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

categoryRouter.get("/", asyncHandler(categoryController.listPublic));

categoryRouter.get(
  "/admin",
  ...ownerOnly,
  asyncHandler(categoryController.listAdmin),
);

categoryRouter.patch(
  "/reorder",
  ...ownerOnly,
  validateRequest({ body: reorderCategoriesSchema }),
  asyncHandler(categoryController.reorder),
);

categoryRouter.post(
  "/",
  ...ownerOnly,
  validateRequest({ body: createCategorySchema }),
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
  asyncHandler(categoryController.update),
);

categoryRouter.delete(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: categoryIdParamSchema }),
  asyncHandler(categoryController.softDelete),
);

categoryRouter.patch(
  "/:id/restore",
  ...ownerOnly,
  validateRequest({ params: categoryIdParamSchema }),
  asyncHandler(categoryController.restore),
);
