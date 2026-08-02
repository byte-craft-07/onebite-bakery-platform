import { Router } from "express";
import { asyncHandler } from "../../../shared/utils/async-handler.js";

export const favoriteRouter = Router();

let userFavorites: string[] = ["prod-1", "prod-2"];

favoriteRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: { favorites: userFavorites },
    });
  }),
);

favoriteRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { productId } = req.body;
    if (productId && !userFavorites.includes(productId)) {
      userFavorites.push(productId);
    }
    res.json({
      success: true,
      data: { favorites: userFavorites },
    });
  }),
);

favoriteRouter.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    userFavorites = userFavorites.filter((id) => id !== productId);
    res.json({
      success: true,
      data: { favorites: userFavorites },
    });
  }),
);
