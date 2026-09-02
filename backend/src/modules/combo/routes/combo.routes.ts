import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { cacheResponse, invalidateCache } from "../../../shared/middlewares/cache.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { comboController } from "../controller/combo.controller.js";

export const comboRouter = Router();

const adminOnly = [requireAuth, requireRoles(["admin"])] as const;

// Public: Get active celebration combos
comboRouter.get(
  "/",
  cacheResponse({ ttlSeconds: 600, tags: ["combos"] }),
  asyncHandler((req, res) => comboController.getActiveCombos(req, res)),
);

// Admin: Get all combos (active + inactive)
comboRouter.get("/admin/all", ...adminOnly, asyncHandler((req, res) => comboController.getAllCombosAdmin(req, res)));

// Public / Protected: Get single combo
comboRouter.get("/:id", cacheResponse({ ttlSeconds: 600, tags: ["combos"] }), asyncHandler((req, res) => comboController.getComboById(req, res)));

// Admin: Create combo
comboRouter.post("/", ...adminOnly, invalidateCache(["combos"]), asyncHandler((req, res) => comboController.createCombo(req, res)));

// Admin: Update combo
comboRouter.put("/:id", ...adminOnly, invalidateCache(["combos"]), asyncHandler((req, res) => comboController.updateCombo(req, res)));

// Admin: Toggle active status
comboRouter.patch("/:id/toggle", ...adminOnly, invalidateCache(["combos"]), asyncHandler((req, res) => comboController.toggleComboStatus(req, res)));

// Admin: Delete combo
comboRouter.delete("/:id", ...adminOnly, invalidateCache(["combos"]), asyncHandler((req, res) => comboController.deleteCombo(req, res)));
