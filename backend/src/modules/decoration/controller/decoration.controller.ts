import type { Request, Response } from "express";
import { decorationService } from "../service/decoration.service.js";

export class DecorationController {
  async getActiveDecorations(req: Request, res: Response): Promise<void> {
    try {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const decorations = await decorationService.getActiveDecorations(category);
      res.status(200).json({
        success: true,
        data: decorations,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch party decorations.",
      });
    }
  }

  async getAllDecorationsAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { search, category, status } = req.query as {
        search?: string;
        category?: string;
        status?: string;
      };
      const decorations = await decorationService.getAllDecorationsAdmin({
        search,
        category,
        status,
      });
      res.status(200).json({
        success: true,
        data: decorations,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch decorations list.",
      });
    }
  }

  async getDecorationById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const decoration = await decorationService.getDecorationById(id);
      if (!decoration) {
        res.status(404).json({
          success: false,
          message: "Decoration item not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: decoration,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch decoration details.",
      });
    }
  }

  async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await decorationService.getCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch decoration categories.",
      });
    }
  }

  async createDecoration(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        nameHi,
        slug,
        category,
        price,
        originalPrice,
        sku,
        unit,
        stockQuantity,
        rating,
        image,
        images,
        description,
        descriptionHi,
        inStock,
        isActive,
        isComingSoon,
        isInstantAvailable,
        isEggless,
        weightOptions,
        displayOrder,
      } = req.body;

      const primaryImage =
        image ||
        (Array.isArray(images) && images.length > 0 ? images[0] : undefined);

      if (!name || price === undefined || !primaryImage || !description) {
        res.status(400).json({
          success: false,
          message: "Name, price, image, and description are required.",
        });
        return;
      }

      const decoration = await decorationService.createDecoration({
        name,
        nameHi,
        slug,
        category: category || "Party Accessories",
        price: Number(price),
        originalPrice: originalPrice !== undefined ? Number(originalPrice) : Math.round(Number(price) * 1.2),
        sku,
        unit,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 50,
        rating: rating !== undefined ? Number(rating) : 4.8,
        image: primaryImage,
        images: Array.isArray(images) && images.length > 0 ? images : [primaryImage],
        description,
        descriptionHi,
        inStock: inStock !== undefined ? Boolean(inStock) : true,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        isComingSoon: isComingSoon !== undefined ? Boolean(isComingSoon) : false,
        isInstantAvailable: isInstantAvailable !== undefined ? Boolean(isInstantAvailable) : true,
        isEggless: isEggless !== undefined ? Boolean(isEggless) : true,
        weightOptions: Array.isArray(weightOptions) ? weightOptions : undefined,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      });

      res.status(201).json({
        success: true,
        message: "Party decoration item created successfully in database.",
        data: decoration,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to create decoration item.",
      });
    }
  }

  async updateDecoration(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const decoration = await decorationService.updateDecoration(id, req.body);
      if (!decoration) {
        res.status(404).json({
          success: false,
          message: "Decoration item not found to update.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Party decoration item updated successfully in database.",
        data: decoration,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update decoration item.",
      });
    }
  }

  async updateDecorationInventory(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { stockQuantity } = req.body;
      const decoration = await decorationService.updateDecorationInventory(id, Number(stockQuantity ?? 0));
      if (!decoration) {
        res.status(404).json({
          success: false,
          message: "Decoration item not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: `Decoration stock quantity updated to ${decoration.stockQuantity}.`,
        data: decoration,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update decoration stock quantity.",
      });
    }
  }

  async toggleDecorationStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const decoration = await decorationService.toggleDecorationStatus(id);
      if (!decoration) {
        res.status(404).json({
          success: false,
          message: "Decoration item not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: `Decoration is now ${decoration.isActive ? "Active" : "Inactive"}.`,
        data: decoration,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to toggle decoration active status.",
      });
    }
  }

  async toggleDecorationStock(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const decoration = await decorationService.toggleDecorationStock(id);
      if (!decoration) {
        res.status(404).json({
          success: false,
          message: "Decoration item not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: `Decoration is now ${decoration.inStock ? "In Stock" : "Out of Stock"}.`,
        data: decoration,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to toggle decoration stock status.",
      });
    }
  }

  async toggleDecorationComingSoon(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const decoration = await decorationService.toggleDecorationComingSoon(id);
      if (!decoration) {
        res.status(404).json({
          success: false,
          message: "Decoration item not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: `Decoration is now ${decoration.isComingSoon ? "Marked as Coming Soon" : "Live and Available"}.`,
        data: decoration,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to toggle decoration coming soon status.",
      });
    }
  }

  async deleteDecoration(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const deleted = await decorationService.deleteDecoration(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Decoration item not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Decoration item permanently deleted from database.",
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to delete decoration item.",
      });
    }
  }
}

export const decorationController = new DecorationController();
