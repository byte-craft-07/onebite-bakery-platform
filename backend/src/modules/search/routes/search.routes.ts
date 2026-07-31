import { Router } from "express";

import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { SearchController } from "../controller/index.js";
import { MongoSearchProvider } from "../providers/index.js";
import { SearchService } from "../service/index.js";
import { searchQuerySchema } from "../validators/index.js";

export const searchRouter = Router();

const searchProvider = new MongoSearchProvider();
const searchService = new SearchService(searchProvider);
const searchController = new SearchController(searchService);

searchRouter.get(
  "/",
  validateRequest({ query: searchQuerySchema }),
  asyncHandler(searchController.search),
);

searchRouter.get(
  "/products",
  validateRequest({ query: searchQuerySchema }),
  asyncHandler(searchController.searchProducts),
);
