import type { Request, Response } from "express";

import { bannerService, type BannerService } from "../service/banner.service.js";

export class BannerController {
  constructor(private readonly service: BannerService = bannerService) {}

  getActiveBanners = async (req: Request, res: Response): Promise<void> => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const placement = (req.query.placement as string) || "home_hero";
      const banners = await this.service.getActiveBanners(placement);
      res.status(200).json({
        success: true,
        data: { banners },
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch active banners.",
      });
    }
  };

  getAllBannersAdmin = async (_req: Request, res: Response): Promise<void> => {
    try {
      const banners = await this.service.getAllBanners();
      res.status(200).json({
        success: true,
        data: { banners },
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch banners.",
      });
    }
  };

  getBannerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const banner = await this.service.getBannerById(id);
      if (!banner) {
        res.status(404).json({
          success: false,
          message: "Banner not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: { banner },
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch banner.",
      });
    }
  };

  createBanner = async (req: Request, res: Response): Promise<void> => {
    try {
      const banner = await this.service.createBanner(req.body);
      res.status(201).json({
        success: true,
        message: "Banner created successfully.",
        data: { banner },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to create banner.",
      });
    }
  };

  updateBanner = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const banner = await this.service.updateBanner(id, req.body);
      if (!banner) {
        res.status(404).json({
          success: false,
          message: "Banner not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Banner updated successfully.",
        data: { banner },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update banner.",
      });
    }
  };

  deleteBanner = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const deleted = await this.service.deleteBanner(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Banner not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Banner deleted successfully.",
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to delete banner.",
      });
    }
  };

  toggleStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { isActive } = req.body;
      const banner = await this.service.toggleStatus(id, Boolean(isActive));
      if (!banner) {
        res.status(404).json({
          success: false,
          message: "Banner not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: `Banner marked as ${isActive ? "Active" : "Inactive"}.`,
        data: { banner },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to toggle banner status.",
      });
    }
  };

  reorderBanners = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({
          success: false,
          message: "orderedIds array is required.",
        });
        return;
      }
      await this.service.reorderBanners(orderedIds);
      res.status(200).json({
        success: true,
        message: "Banners reordered successfully.",
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to reorder banners.",
      });
    }
  };
}

export const bannerController = new BannerController();
