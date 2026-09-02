import type { Request, Response } from "express";
import { comboService } from "../service/combo.service.js";

export class ComboController {
  async getActiveCombos(_req: Request, res: Response): Promise<void> {
    try {
      const combos = await comboService.getActiveCombos();
      res.status(200).json({
        success: true,
        data: combos,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch celebration combos.",
      });
    }
  }

  async getAllCombosAdmin(_req: Request, res: Response): Promise<void> {
    try {
      const combos = await comboService.getAllCombosAdmin();
      res.status(200).json({
        success: true,
        data: combos,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch combos list.",
      });
    }
  }

  async getComboById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const combo = await comboService.getComboById(id);
      if (!combo) {
        res.status(404).json({
          success: false,
          message: "Combo hamper not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: combo,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch combo details.",
      });
    }
  }

  async createCombo(req: Request, res: Response): Promise<void> {
    try {
      const { title, slug, description, items, price, originalPrice, image, images, badge, isActive, isAvailable, displayOrder } = req.body;

      if (!title || !items || !price || !originalPrice || !image) {
        res.status(400).json({
          success: false,
          message: "Title, items list, price, originalPrice and image are required.",
        });
        return;
      }

      const combo = await comboService.createCombo({
        title,
        slug,
        description,
        items: Array.isArray(items) ? items : [items],
        price: Number(price),
        originalPrice: Number(originalPrice),
        image,
        images,
        badge,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        displayOrder: displayOrder ? Number(displayOrder) : 0,
      });

      res.status(201).json({
        success: true,
        message: "Celebration combo created successfully.",
        data: combo,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to create combo hamper.",
      });
    }
  }

  async updateCombo(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const combo = await comboService.updateCombo(id, req.body);
      if (!combo) {
        res.status(404).json({
          success: false,
          message: "Combo not found to update.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Combo updated successfully.",
        data: combo,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to update combo.",
      });
    }
  }

  async toggleComboStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const combo = await comboService.toggleComboStatus(id);
      if (!combo) {
        res.status(404).json({
          success: false,
          message: "Combo not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: `Combo status changed to ${combo.isActive ? "Active" : "Inactive"}.`,
        data: combo,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to toggle combo status.",
      });
    }
  }

  async deleteCombo(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const deleted = await comboService.deleteCombo(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Combo not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Combo deleted successfully.",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Failed to delete combo.",
      });
    }
  }
}

export const comboController = new ComboController();
