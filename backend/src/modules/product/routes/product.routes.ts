import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { ProductController } from "../controller/index.js";
import { InventoryRepository, ProductRepository } from "../repository/index.js";
import { InventoryService, ProductService } from "../service/index.js";
import {
  createProductSchema,
  productIdParamSchema,
  productSlugParamSchema,
  publicProductQuerySchema,
  updateAvailabilitySchema,
  updateInventorySchema,
  updatePricingSchema,
  updateProductSchema,
} from "../validators/index.js";

export const productRouter = Router();

const productRepository = new ProductRepository();
const inventoryRepository = new InventoryRepository();
const productService = new ProductService(productRepository, inventoryRepository);
const inventoryService = new InventoryService(inventoryRepository);
const productController = new ProductController(productService, inventoryService);
const ownerOnly = [requireAuth, requireRoles(["admin"])] as const;

productRouter.get(
  "/",
  validateRequest({ query: publicProductQuerySchema }),
  asyncHandler(productController.listPublicCatalog),
);

productRouter.get(
  "/featured",
  validateRequest({ query: publicProductQuerySchema }),
  asyncHandler(productController.listFeatured),
);

productRouter.get(
  "/trending",
  validateRequest({ query: publicProductQuerySchema }),
  asyncHandler(productController.listTrending),
);

productRouter.get(
  "/recommended",
  validateRequest({ query: publicProductQuerySchema }),
  asyncHandler(productController.listRecommended),
);

productRouter.get(
  "/seasonal",
  validateRequest({ query: publicProductQuerySchema }),
  asyncHandler(productController.listSeasonal),
);

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

productRouter.get(
  "/admin/:id/inventory",
  ...ownerOnly,
  validateRequest({ params: productIdParamSchema }),
  asyncHandler(productController.getInventory),
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

productRouter.patch(
  "/:id/pricing",
  ...ownerOnly,
  validateRequest({ params: productIdParamSchema, body: updatePricingSchema }),
  asyncHandler(productController.updatePricing),
);

productRouter.patch(
  "/:id/inventory",
  ...ownerOnly,
  validateRequest({ params: productIdParamSchema, body: updateInventorySchema }),
  asyncHandler(productController.updateInventory),
);

productRouter.patch(
  "/:id/availability",
  ...ownerOnly,
  validateRequest({
    params: productIdParamSchema,
    body: updateAvailabilitySchema,
  }),
  asyncHandler(productController.updateAvailability),
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
