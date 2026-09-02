import { Router } from "express";

import { toObjectId } from "../../../db/utils/object-id.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { requireAuth } from "../../auth/middlewares/index.js";
import type { AuthenticatedRequest } from "../../auth/types/index.js";
import { FavoriteModel } from "../model/favorite.model.js";

export const favoriteRouter = Router();

favoriteRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = toObjectId(authenticatedRequest.user.id);

    const userFavDocs = await FavoriteModel.find({ userId }).lean().exec();
    const productIds = userFavDocs.map((doc) => doc.productId);

    return sendSuccess(res, {
      message: "Favorites fetched successfully.",
      data: { favorites: productIds },
    });
  }),
);

favoriteRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = toObjectId(authenticatedRequest.user.id);
    const { productId } = req.body;

    if (productId && typeof productId === "string") {
      await FavoriteModel.findOneAndUpdate(
        { userId, productId },
        { userId, productId },
        { upsert: true, new: true },
      ).exec();
    }

    const userFavDocs = await FavoriteModel.find({ userId }).lean().exec();
    const productIds = userFavDocs.map((doc) => doc.productId);

    return sendSuccess(res, {
      message: "Favorite added successfully.",
      data: { favorites: productIds },
    });
  }),
);

favoriteRouter.delete(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = toObjectId(authenticatedRequest.user.id);
    const { productId } = req.params;

    if (productId) {
      await FavoriteModel.deleteOne({ userId, productId }).exec();
    }

    const userFavDocs = await FavoriteModel.find({ userId }).lean().exec();
    const productIds = userFavDocs.map((doc) => doc.productId);

    return sendSuccess(res, {
      message: "Favorite removed successfully.",
      data: { favorites: productIds },
    });
  }),
);
