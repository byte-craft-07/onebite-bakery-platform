import { Types } from "mongoose";

import {
  BusinessHubModel,
  type BusinessHub,
  type BusinessDayHours,
  type DayOfWeek,
} from "../model/business-hub.model.js";
import {
  BusinessLinkModel,
  type BusinessLink,
  type LinkType,
} from "../model/business-link.model.js";
import {
  BusinessAnalyticsModel,
  type AnalyticsEventType,
} from "../model/business-analytics.model.js";

export interface BusinessStatus {
  isOpen: boolean;
  statusText: string;
  currentDay: DayOfWeek;
  todayHours?: BusinessDayHours;
  nextOpenText?: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  clicksByEvent: Record<string, number>;
  clicksByDevice: Record<string, number>;
  topLinks: Array<{
    _id: string;
    title: string;
    url: string;
    type: LinkType;
    clickCount: number;
  }>;
}

export class BusinessHubService {
  /**
   * Ensures the BusinessHub config document exists with defaults.
   */
  async getOrCreateConfig(): Promise<BusinessHub> {
    let hub = await BusinessHubModel.findOne();
    if (!hub) {
      hub = await BusinessHubModel.create({
        businessName: "OneBite Bakery",
        tagline: "Fresh cakes for every special moment.",
        shortDescription:
          "Your neighborhood artisan bakery creating fresh handcrafted cakes and sweet celebration treats.",
        description:
          "At OneBite Bakery, every recipe begins with pure ingredients, premium chocolate, and handcrafted passion. From custom designer birthday cakes to artisanal pastries and party celebration combos, we make every sweet moment memorable.",
        logoUrl: "/onebite_logo_full.svg",
        phone: "+91 98765 43210",
        whatsapp: "+919876543210",
        whatsappMessage: "Hello OneBite Bakery, I want to place an order.",
        email: "contact@onebitebakery.in",
        websiteUrl: "/products",
        mapUrl: "https://maps.google.com/?q=OneBite+Bakery",
        address: {
          fullAddress: "OneBite Bakery, Main Market Road",
          village: "Terha",
          district: "Unnao",
          state: "Uttar Pradesh",
          pincode: "209801",
        },
        social: {
          instagram: "https://instagram.com/onebitebakery",
          facebook: "",
          youtube: "",
          whatsapp: "https://wa.me/919876543210",
        },
        isPublished: true,
        isOfficialVerified: true,
        foundedYear: "2024",
        businessCategory: "Bakery & Confectionery",
      });
    }
    return hub;
  }

  /**
   * Automatically populates initial default links if none exist.
   */
  async seedDefaultLinksIfEmpty(): Promise<void> {
    const count = await BusinessLinkModel.countDocuments();
    if (count > 0) return;

    const defaultLinks: Array<Partial<BusinessLink>> = [
      {
        title: "Order Online",
        description: "Explore our full bakery menu & order for delivery",
        type: "WEBSITE",
        url: "/products",
        icon: "ShoppingBag",
        isActive: true,
        isFeatured: true,
        openInNewTab: false,
        sortOrder: 1,
        clickCount: 0,
      },
      {
        title: "Order on WhatsApp",
        description: "Chat directly with our pastry chef & place quick orders",
        type: "WHATSAPP",
        url: "https://wa.me/919876543210?text=Hello%20OneBite%20Bakery%2C%20I%20want%20to%20place%20an%20order.",
        icon: "MessageCircle",
        isActive: true,
        isFeatured: true,
        openInNewTab: true,
        sortOrder: 2,
        clickCount: 0,
      },
      {
        title: "Find Us on Map",
        description: "Get turn-by-turn Google Maps directions to our bakery",
        type: "MAP",
        url: "https://maps.google.com/?q=OneBite+Bakery",
        icon: "MapPin",
        isActive: true,
        isFeatured: false,
        openInNewTab: true,
        sortOrder: 3,
        clickCount: 0,
      },
      {
        title: "View Instagram",
        description: "Daily fresh bakes, custom cakes & customer stories",
        type: "INSTAGRAM",
        url: "https://instagram.com/onebitebakery",
        icon: "Instagram",
        isActive: true,
        isFeatured: false,
        openInNewTab: true,
        sortOrder: 4,
        clickCount: 0,
      },
      {
        title: "Call Us",
        description: "Speak directly with our team for questions & reservations",
        type: "PHONE",
        url: "tel:+919876543210",
        icon: "Phone",
        isActive: true,
        isFeatured: false,
        openInNewTab: false,
        sortOrder: 5,
        clickCount: 0,
      },
      {
        title: "Birthday Cakes",
        description: "Designer cakes made fresh for every celebration",
        type: "CATEGORY",
        url: "/categories",
        icon: "Cake",
        isActive: true,
        isFeatured: false,
        openInNewTab: false,
        sortOrder: 6,
        clickCount: 0,
      },
      {
        title: "Custom Cakes Studio",
        description: "Upload your reference & design your dream cake",
        type: "CUSTOM",
        url: "/custom-cake",
        icon: "Sparkles",
        isActive: true,
        isFeatured: false,
        openInNewTab: false,
        sortOrder: 7,
        clickCount: 0,
      },
      {
        title: "Pastries & Cupcakes",
        description: "Individual handcrafted sweet bites",
        type: "CATEGORY",
        url: "/categories",
        icon: "Heart",
        isActive: true,
        isFeatured: false,
        openInNewTab: false,
        sortOrder: 8,
        clickCount: 0,
      },
      {
        title: "Party & Celebration Combos",
        description: "Cakes bundled with balloons, snacks & candles",
        type: "PRODUCT",
        url: "/combos",
        icon: "Gift",
        isActive: true,
        isFeatured: false,
        openInNewTab: false,
        sortOrder: 9,
        clickCount: 0,
      },
      {
        title: "Customer Reviews",
        description: "See verified love and feedback from sweet lovers",
        type: "REVIEWS",
        url: "/#reviews",
        icon: "Star",
        isActive: true,
        isFeatured: false,
        openInNewTab: false,
        sortOrder: 10,
        clickCount: 0,
      },
      {
        title: "About This Business",
        description: "Learn about our ingredients, journey and mission",
        type: "ABOUT",
        url: "#about",
        icon: "Info",
        isActive: true,
        isFeatured: false,
        openInNewTab: false,
        sortOrder: 11,
        clickCount: 0,
      },
    ];

    await BusinessLinkModel.insertMany(defaultLinks);
  }

  /**
   * Calculates live Open / Closed status using Asia/Kolkata timezone.
   */
  calculateBusinessStatus(hours: BusinessDayHours[] = []): BusinessStatus {
    const days: DayOfWeek[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    // Current time in Asia/Kolkata
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      weekday: "long",
    });

    const parts = formatter.formatToParts(now);
    const weekdayStr = (
      parts.find((p) => p.type === "weekday")?.value || ""
    ).toLowerCase() as DayOfWeek;
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const currentTimeMinutes = hour * 60 + minute;

    const currentDay = days.includes(weekdayStr) ? weekdayStr : "monday";
    const todayHours = hours.find((h) => h.day === currentDay);

    if (!todayHours || todayHours.isClosed) {
      return {
        isOpen: false,
        statusText: "Closed Today",
        currentDay,
        todayHours,
      };
    }

    const [openHStr, openMStr] = todayHours.openTime.split(":");
    const [closeHStr, closeMStr] = todayHours.closeTime.split(":");
    const openH = Number(openHStr ?? 0);
    const openM = Number(openMStr ?? 0);
    const closeH = Number(closeHStr ?? 0);
    const closeM = Number(closeMStr ?? 0);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const isOpen = currentTimeMinutes >= openMinutes && currentTimeMinutes < closeMinutes;

    return {
      isOpen,
      statusText: isOpen ? "Open Now" : "Closed Now",
      currentDay,
      todayHours,
      nextOpenText: isOpen
        ? `Closes at ${todayHours.closeTime}`
        : `Opens at ${todayHours.openTime}`,
    };
  }

  /**
   * Public data endpoint: safe, published profile + active links only.
   */
  async getPublicHub(): Promise<{
    hub: BusinessHub;
    links: BusinessLink[];
    status: BusinessStatus;
  }> {
    await this.seedDefaultLinksIfEmpty();
    const hub = await this.getOrCreateConfig();
    const links = await BusinessLinkModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    const status = this.calculateBusinessStatus(hub.businessHours);

    return {
      hub,
      links: links as unknown as BusinessLink[],
      status,
    };
  }

  /**
   * Admin full data endpoint: all links, full config, and analytics.
   */
  async getAdminHub(): Promise<{
    hub: BusinessHub;
    links: BusinessLink[];
    status: BusinessStatus;
    analytics: AnalyticsSummary;
  }> {
    await this.seedDefaultLinksIfEmpty();
    const hub = await this.getOrCreateConfig();
    const links = await BusinessLinkModel.find().sort({ sortOrder: 1 }).lean();
    const status = this.calculateBusinessStatus(hub.businessHours);
    const analytics = await this.getAnalyticsSummary();

    return {
      hub,
      links: links as unknown as BusinessLink[],
      status,
      analytics,
    };
  }

  /**
   * Update Profile
   */
  async updateProfile(data: Partial<BusinessHub>): Promise<BusinessHub> {
    const updated = await BusinessHubModel.findOneAndUpdate(
      {},
      { $set: data },
      { new: true, upsert: true },
    );
    return updated as BusinessHub;
  }

  /**
   * Update Business Hours
   */
  async updateBusinessHours(hours: BusinessDayHours[]): Promise<BusinessHub> {
    const updated = await BusinessHubModel.findOneAndUpdate(
      {},
      { $set: { businessHours: hours } },
      { new: true, upsert: true },
    );
    return updated as BusinessHub;
  }

  /**
   * Update Social Links
   */
  async updateSocial(social: Partial<BusinessHub["social"]>): Promise<BusinessHub> {
    const hub = await this.getOrCreateConfig();
    const updated = await BusinessHubModel.findOneAndUpdate(
      {},
      { $set: { social: { ...hub.social, ...social } } },
      { new: true, upsert: true },
    );
    return updated as BusinessHub;
  }

  /**
   * Update Location & Coordinates
   */
  async updateLocation(data: {
    address: BusinessHub["address"];
    mapUrl?: string;
    coordinates?: BusinessHub["coordinates"];
  }): Promise<BusinessHub> {
    const updateObj: Record<string, unknown> = {};
    if (data.address) updateObj.address = data.address;
    if (data.mapUrl !== undefined) updateObj.mapUrl = data.mapUrl;
    if (data.coordinates) updateObj.coordinates = data.coordinates;

    const updated = await BusinessHubModel.findOneAndUpdate(
      {},
      { $set: updateObj },
      { new: true, upsert: true },
    );
    return updated as BusinessHub;
  }

  /**
   * Update Appearance
   */
  async updateAppearance(appearance: BusinessHub["appearance"]): Promise<BusinessHub> {
    const updated = await BusinessHubModel.findOneAndUpdate(
      {},
      { $set: { appearance } },
      { new: true, upsert: true },
    );
    return updated as BusinessHub;
  }

  /**
   * Update SEO
   */
  async updateSeo(seo: BusinessHub["seo"]): Promise<BusinessHub> {
    const updated = await BusinessHubModel.findOneAndUpdate(
      {},
      { $set: { seo } },
      { new: true, upsert: true },
    );
    return updated as BusinessHub;
  }

  /**
   * Create Link
   */
  async createLink(data: Partial<BusinessLink>): Promise<BusinessLink> {
    const lastLink = await BusinessLinkModel.findOne().sort({ sortOrder: -1 });
    const nextOrder = data.sortOrder !== undefined ? data.sortOrder : (lastLink?.sortOrder ?? 0) + 1;

    const link = await BusinessLinkModel.create({
      ...data,
      sortOrder: nextOrder,
      clickCount: 0,
    });
    return link;
  }

  /**
   * Update Link
   */
  async updateLink(id: string, data: Partial<BusinessLink>): Promise<BusinessLink | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return BusinessLinkModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  /**
   * Delete Link
   */
  async deleteLink(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await BusinessLinkModel.findByIdAndDelete(id);
    return Boolean(result);
  }

  /**
   * Toggle Link Active Status
   */
  async toggleLinkStatus(id: string, isActive: boolean): Promise<BusinessLink | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return BusinessLinkModel.findByIdAndUpdate(id, { $set: { isActive } }, { new: true });
  }

  /**
   * Duplicate Link
   */
  async duplicateLink(id: string): Promise<BusinessLink | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const existing = await BusinessLinkModel.findById(id).lean();
    if (!existing) return null;

    const lastLink = await BusinessLinkModel.findOne().sort({ sortOrder: -1 });
    const newOrder = (lastLink?.sortOrder ?? existing.sortOrder) + 1;

    const duplicated = await BusinessLinkModel.create({
      title: `${existing.title} (Copy)`,
      description: existing.description,
      type: existing.type,
      url: existing.url,
      icon: existing.icon,
      imageUrl: existing.imageUrl,
      isActive: existing.isActive,
      isFeatured: existing.isFeatured,
      openInNewTab: existing.openInNewTab,
      sortOrder: newOrder,
      clickCount: 0,
    });
    return duplicated;
  }

  /**
   * Reorder Links
   */
  async reorderLinks(orderedIds: string[]): Promise<void> {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { $set: { sortOrder: index + 1 } },
      },
    }));

    if (bulkOps.length > 0) {
      await BusinessLinkModel.bulkWrite(bulkOps);
    }
  }

  /**
   * Reset default links
   */
  async resetDefaultLinks(): Promise<BusinessLink[]> {
    await BusinessLinkModel.deleteMany({});
    await this.seedDefaultLinksIfEmpty();
    return BusinessLinkModel.find().sort({ sortOrder: 1 });
  }

  /**
   * Track Click or View Event
   */
  async trackEvent(
    eventType: AnalyticsEventType,
    linkId?: string,
    deviceType: "mobile" | "tablet" | "desktop" = "mobile",
    referrer: string = "",
  ): Promise<void> {
    const validLinkId = linkId && Types.ObjectId.isValid(linkId) ? new Types.ObjectId(linkId) : undefined;

    await BusinessAnalyticsModel.create({
      eventType,
      linkId: validLinkId,
      deviceType,
      referrer: referrer.slice(0, 500),
    });

    if (validLinkId) {
      await BusinessLinkModel.findByIdAndUpdate(validLinkId, { $inc: { clickCount: 1 } });
    }
  }

  /**
   * Analytics Summary for Admin
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const [totalViews, totalClicks, eventAgg, deviceAgg, topLinks] = await Promise.all([
      BusinessAnalyticsModel.countDocuments({ eventType: "page_view" }),
      BusinessAnalyticsModel.countDocuments({ eventType: { $ne: "page_view" } }),
      BusinessAnalyticsModel.aggregate([
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
      ]),
      BusinessAnalyticsModel.aggregate([
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
      ]),
      BusinessLinkModel.find()
        .sort({ clickCount: -1 })
        .limit(5)
        .select("_id title url type clickCount")
        .lean(),
    ]);

    const clicksByEvent: Record<string, number> = {};
    for (const item of eventAgg) {
      clicksByEvent[item._id] = item.count;
    }

    const clicksByDevice: Record<string, number> = {};
    for (const item of deviceAgg) {
      clicksByDevice[item._id] = item.count;
    }

    return {
      totalViews,
      totalClicks,
      clicksByEvent,
      clicksByDevice,
      topLinks: topLinks as unknown as AnalyticsSummary["topLinks"],
    };
  }
}

export const businessHubService = new BusinessHubService();
