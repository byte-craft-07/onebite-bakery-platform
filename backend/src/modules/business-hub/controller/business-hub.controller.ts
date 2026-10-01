import type { Request, Response } from "express";

import { businessHubService, type BusinessHubService } from "../service/business-hub.service.js";

export class BusinessHubController {
  constructor(private readonly service: BusinessHubService = businessHubService) {}

  // ── Public Endpoints ──

  getPublicHub = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const data = await this.service.getPublicHub();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch business hub information.",
      });
    }
  };

  trackEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventType, linkId, deviceType, referrer } = req.body;
      const userAgent = req.headers["user-agent"] || "";
      const detectedDevice = deviceType || (/mobile/i.test(userAgent) ? "mobile" : /tablet|ipad/i.test(userAgent) ? "tablet" : "desktop");

      await this.service.trackEvent(
        eventType || "page_view",
        linkId,
        detectedDevice,
        referrer || (req.headers["referer"] as string) || "",
      );

      res.status(200).json({ success: true, message: "Event tracked." });
    } catch (_err) {
      // Analytics should never break user flow
      res.status(200).json({ success: true, message: "Ignored." });
    }
  };

  trackLinkClick = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const userAgent = req.headers["user-agent"] || "";
      const detectedDevice = /mobile/i.test(userAgent) ? "mobile" : /tablet|ipad/i.test(userAgent) ? "tablet" : "desktop";

      await this.service.trackEvent(
        "custom_link",
        id,
        detectedDevice,
        (req.headers["referer"] as string) || "",
      );

      res.status(200).json({ success: true, message: "Link click recorded." });
    } catch (_err) {
      res.status(200).json({ success: true, message: "Ignored." });
    }
  };

  // ── Admin Endpoints ──

  getAdminHub = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.service.getAdminHub();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to load admin business hub details.",
      });
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await this.service.updateProfile(req.body);
      res.status(200).json({
        success: true,
        message: "Business profile updated successfully.",
        data: { hub: updated },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update business profile.",
      });
    }
  };

  createLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const link = await this.service.createLink(req.body);
      res.status(201).json({
        success: true,
        message: "Business link created successfully.",
        data: { link },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to create business link.",
      });
    }
  };

  updateLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const link = await this.service.updateLink(id, req.body);
      if (!link) {
        res.status(404).json({
          success: false,
          message: "Business link not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Business link updated successfully.",
        data: { link },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update business link.",
      });
    }
  };

  deleteLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const deleted = await this.service.deleteLink(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Business link not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Business link deleted successfully.",
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to delete business link.",
      });
    }
  };

  toggleLinkStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { isActive } = req.body;
      const link = await this.service.toggleLinkStatus(id, Boolean(isActive));
      if (!link) {
        res.status(404).json({
          success: false,
          message: "Business link not found.",
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: `Link marked as ${isActive ? "Active" : "Inactive"}.`,
        data: { link },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to toggle link status.",
      });
    }
  };

  duplicateLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const duplicated = await this.service.duplicateLink(id);
      if (!duplicated) {
        res.status(404).json({
          success: false,
          message: "Business link not found.",
        });
        return;
      }
      res.status(201).json({
        success: true,
        message: "Business link duplicated successfully.",
        data: { link: duplicated },
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to duplicate link.",
      });
    }
  };

  reorderLinks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({
          success: false,
          message: "orderedIds array is required.",
        });
        return;
      }
      await this.service.reorderLinks(orderedIds);
      res.status(200).json({
        success: true,
        message: "Links reordered successfully.",
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to reorder links.",
      });
    }
  };

  resetDefaultLinks = async (_req: Request, res: Response): Promise<void> => {
    try {
      const links = await this.service.resetDefaultLinks();
      res.status(200).json({
        success: true,
        message: "Default business links restored successfully.",
        data: { links },
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to reset links.",
      });
    }
  };

  updateBusinessHours = async (req: Request, res: Response): Promise<void> => {
    try {
      const { businessHours } = req.body;
      const hub = await this.service.updateBusinessHours(businessHours);
      res.status(200).json({
        success: true,
        message: "Business hours updated successfully.",
        data: { hub },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update business hours.",
      });
    }
  };

  updateSocial = async (req: Request, res: Response): Promise<void> => {
    try {
      const hub = await this.service.updateSocial(req.body);
      res.status(200).json({
        success: true,
        message: "Social media links updated successfully.",
        data: { hub },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update social media links.",
      });
    }
  };

  updateLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const hub = await this.service.updateLocation(req.body);
      res.status(200).json({
        success: true,
        message: "Location and map details updated successfully.",
        data: { hub },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update location details.",
      });
    }
  };

  updateAppearance = async (req: Request, res: Response): Promise<void> => {
    try {
      const hub = await this.service.updateAppearance(req.body);
      res.status(200).json({
        success: true,
        message: "Theme and appearance settings updated successfully.",
        data: { hub },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update appearance.",
      });
    }
  };

  updateSeo = async (req: Request, res: Response): Promise<void> => {
    try {
      const hub = await this.service.updateSeo(req.body);
      res.status(200).json({
        success: true,
        message: "SEO and metadata updated successfully.",
        data: { hub },
      });
    } catch (err: unknown) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to update SEO settings.",
      });
    }
  };

  getAnalytics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const analytics = await this.service.getAnalyticsSummary();
      res.status(200).json({
        success: true,
        data: { analytics },
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to fetch analytics.",
      });
    }
  };
}

export const businessHubController = new BusinessHubController();
