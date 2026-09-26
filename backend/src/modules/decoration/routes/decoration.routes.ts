import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { cacheResponse, invalidateCache } from "../../../shared/middlewares/cache.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { decorationController } from "../controller/decoration.controller.js";

export const decorationRouter = Router();

const adminOnly = [requireAuth, requireRoles(["admin"])] as const;

// Public: Get active decorations (optionally filter by ?category=...)
decorationRouter.get(
  "/",
  cacheResponse({ ttlSeconds: 300, tags: ["decorations"] }),
  asyncHandler((req, res) => decorationController.getActiveDecorations(req, res)),
);

// Admin: Get all decorations (with search, category, status filters)
decorationRouter.get(
  "/admin/all",
  ...adminOnly,
  asyncHandler((req, res) => decorationController.getAllDecorationsAdmin(req, res)),
);

// Public: Get single decoration
decorationRouter.get(
  "/:id",
  cacheResponse({ ttlSeconds: 300, tags: ["decorations"] }),
  asyncHandler((req, res) => decorationController.getDecorationById(req, res)),
);

// Admin: Create decoration
decorationRouter.post(
  "/",
  ...adminOnly,
  invalidateCache(["decorations"]),
  asyncHandler((req, res) => decorationController.createDecoration(req, res)),
);

// Admin: Update decoration
decorationRouter.put(
  "/:id",
  ...adminOnly,
  invalidateCache(["decorations"]),
  asyncHandler((req, res) => decorationController.updateDecoration(req, res)),
);

// Admin: Toggle active status
decorationRouter.patch(
  "/:id/toggle",
  ...adminOnly,
  invalidateCache(["decorations"]),
  asyncHandler((req, res) => decorationController.toggleDecorationStatus(req, res)),
);

// Admin: Toggle stock status
decorationRouter.patch(
  "/:id/stock",
  ...adminOnly,
  invalidateCache(["decorations"]),
  asyncHandler((req, res) => decorationController.toggleDecorationStock(req, res)),
);

// Admin: Delete decoration permanently
decorationRouter.delete(
  "/:id",
  ...adminOnly,
  invalidateCache(["decorations"]),
  asyncHandler((req, res) => decorationController.deleteDecoration(req, res)),
);
