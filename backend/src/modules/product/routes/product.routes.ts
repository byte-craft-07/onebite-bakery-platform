import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { ProductController } from "../controller/index.js";
import { ProductRepository } from "../repository/index.js";
import { ProductService } from "../service/index.js";
import {
  createProductSchema,
  productIdParamSchema,
  productSlugParamSchema,
  updateProductSchema,
} from "../validators/index.js";

export const productRouter = Router();

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);
const ownerOnly = [requireAuth, requireRoles(["admin"])] as const;

productRouter.get("/", asyncHandler(productController.listPublic));

productRouter.get(
  "/admin",
  ...ownerOnly,
  asyncHandler(productController.listAdmin),
);

productRouter.get(
  "/admin/:id",
  ...ownerOnly,
  validateRequest({ params: productIdParamSchema }),
  asyncHandler(productController.getById),
);

productRouter.post(
  "/",
  ...ownerOnly,
  validateRequest({ body: createProductSchema }),
  asyncHandler(productController.create),
);

productRouter.patch(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: productIdParamSchema, body: updateProductSchema }),
  asyncHandler(productController.update),
);

productRouter.delete(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: productIdParamSchema }),
  asyncHandler(productController.softDelete),
);

productRouter.patch(
  "/:id/restore",
  ...ownerOnly,
  validateRequest({ params: productIdParamSchema }),
  asyncHandler(productController.restore),
);

productRouter.get(
  "/:slug",
  validateRequest({ params: productSlugParamSchema }),
  asyncHandler(productController.getPublicBySlug),
);
