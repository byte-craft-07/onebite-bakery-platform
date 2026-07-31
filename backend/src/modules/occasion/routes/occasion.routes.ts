import { Router } from "express";

import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { publicProductQuerySchema } from "../../product/validators/index.js";
import { OccasionController } from "../controller/occasion.controller.js";
import { OccasionRepository } from "../repository/occasion.repository.js";
import { OccasionService } from "../service/occasion.service.js";
import { occasionSlugParamSchema } from "../validators/occasion.validators.js";

export const occasionRouter = Router();

const occasionRepository = new OccasionRepository();
const occasionService = new OccasionService(occasionRepository);
const occasionController = new OccasionController(occasionService);

occasionRouter.get("/", asyncHandler(occasionController.listPublic));

occasionRouter.get(
  "/:slug",
  validateRequest({ params: occasionSlugParamSchema }),
  asyncHandler(occasionController.getBySlug),
);

occasionRouter.get(
  "/:slug/products",
  validateRequest({
    params: occasionSlugParamSchema,
    query: publicProductQuerySchema,
  }),
  asyncHandler(occasionController.listProductsBySlug),
);
