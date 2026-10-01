import { apiClient } from "./api.client";

export type LinkType =
  | "WEBSITE"
  | "WHATSAPP"
  | "PHONE"
  | "MAP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "YOUTUBE"
  | "EMAIL"
  | "CUSTOM"
  | "PRODUCT"
  | "CATEGORY"
  | "ABOUT"
  | "REVIEWS";

export interface BusinessDayHours {
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  specialNote?: string;
}

export interface BusinessHubAddress {
  fullAddress: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
}

export interface BusinessHubCoordinates {
  latitude: number;
  longitude: number;
}

export interface BusinessHubSocial {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface BusinessHubAppearance {
  theme: "onebite_premium" | "minimal_cream" | "pistachio_bakery" | "chocolate_cream";
  buttonStyle: "rounded-full" | "rounded-xl" | "rounded-lg" | "pill";
  cardStyle: "clean" | "elevated" | "glass" | "bordered";
  borderRadius: "sm" | "md" | "lg" | "full";
  profileLayout: "centered" | "left" | "cover";
}

export interface BusinessHubSeo {
  title: string;
  description: string;
  image?: string;
  keywords?: string[];
}

export interface BusinessHubProfile {
  _id?: string;
  businessName: string;
  tagline: string;
  shortDescription: string;
  description: string;
  logoUrl: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  phone: string;
  whatsapp: string;
  whatsappMessage: string;
  email: string;
  websiteUrl: string;
  mapUrl: string;
  address: BusinessHubAddress;
  coordinates?: BusinessHubCoordinates;
  social: BusinessHubSocial;
  businessHours: BusinessDayHours[];
  appearance: BusinessHubAppearance;
  seo: BusinessHubSeo;
  isPublished: boolean;
  isOfficialVerified: boolean;
  foundedYear: string;
  businessCategory: string;
}

export interface BusinessLink {
  _id: string;
  title: string;
  description?: string;
  type: LinkType;
  url: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  openInNewTab: boolean;
  sortOrder: number;
  clickCount: number;
}

export interface BusinessStatus {
  isOpen: boolean;
  statusText: string;
  currentDay: string;
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

export interface PublicHubData {
  hub: BusinessHubProfile;
  links: BusinessLink[];
  status: BusinessStatus;
}

export interface AdminHubData {
  hub: BusinessHubProfile;
  links: BusinessLink[];
  status: BusinessStatus;
  analytics: AnalyticsSummary;
}

export const calculateBusinessStatus = (
  hours: BusinessDayHours[] = [],
): BusinessStatus => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
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
  ).toLowerCase();
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
};

class BusinessHubService {
  async getPublicHub(): Promise<PublicHubData> {
    const res = await apiClient.get<{ success: boolean; data: PublicHubData }>("/business-hub");
    return res.data.data;
  }

  async trackEvent(
    eventType: string,
    linkId?: string,
    deviceType?: "mobile" | "tablet" | "desktop",
    referrer?: string,
  ): Promise<void> {
    try {
      await apiClient.post("/business-hub/track", {
        eventType,
        linkId,
        deviceType,
        referrer,
      });
    } catch {
      // Analytics should never throw to user
    }
  }

  async trackLinkClick(id: string): Promise<void> {
    try {
      await apiClient.post(`/business-hub/links/${id}/click`);
    } catch {
      // Analytics should never throw to user
    }
  }

  async getAdminHub(): Promise<AdminHubData> {
    const res = await apiClient.get<{ success: boolean; data: AdminHubData }>("/admin/business-hub/admin");
    return res.data.data;
  }

  async updateProfile(data: Partial<BusinessHubProfile>): Promise<BusinessHubProfile> {
    const res = await apiClient.put<{ success: boolean; data: { hub: BusinessHubProfile } }>(
      "/admin/business-hub/profile",
      data,
    );
    return res.data.data.hub;
  }

  async createLink(data: Partial<BusinessLink>): Promise<BusinessLink> {
    const res = await apiClient.post<{ success: boolean; data: { link: BusinessLink } }>(
      "/admin/business-hub/links",
      data,
    );
    return res.data.data.link;
  }

  async updateLink(id: string, data: Partial<BusinessLink>): Promise<BusinessLink> {
    const res = await apiClient.put<{ success: boolean; data: { link: BusinessLink } }>(
      `/admin/business-hub/links/${id}`,
      data,
    );
    return res.data.data.link;
  }

  async deleteLink(id: string): Promise<void> {
    await apiClient.delete(`/admin/business-hub/links/${id}`);
  }

  async toggleLinkStatus(id: string, isActive: boolean): Promise<BusinessLink> {
    const res = await apiClient.patch<{ success: boolean; data: { link: BusinessLink } }>(
      `/admin/business-hub/links/${id}/status`,
      { isActive },
    );
    return res.data.data.link;
  }

  async duplicateLink(id: string): Promise<BusinessLink> {
    const res = await apiClient.post<{ success: boolean; data: { link: BusinessLink } }>(
      `/admin/business-hub/links/${id}/duplicate`,
    );
    return res.data.data.link;
  }

  async reorderLinks(orderedIds: string[]): Promise<void> {
    await apiClient.put("/admin/business-hub/links/reorder", { orderedIds });
  }

  async resetDefaultLinks(): Promise<BusinessLink[]> {
    const res = await apiClient.post<{ success: boolean; data: { links: BusinessLink[] } }>(
      "/admin/business-hub/links/reset-defaults",
    );
    return res.data.data.links;
  }

  async updateBusinessHours(hours: BusinessDayHours[]): Promise<BusinessHubProfile> {
    const res = await apiClient.put<{ success: boolean; data: { hub: BusinessHubProfile } }>(
      "/admin/business-hub/hours",
      { businessHours: hours },
    );
    return res.data.data.hub;
  }

  async updateSocial(social: BusinessHubSocial): Promise<BusinessHubProfile> {
    const res = await apiClient.put<{ success: boolean; data: { hub: BusinessHubProfile } }>(
      "/admin/business-hub/social",
      social,
    );
    return res.data.data.hub;
  }

  async updateLocation(data: {
    address: BusinessHubAddress;
    mapUrl?: string;
    coordinates?: BusinessHubCoordinates;
  }): Promise<BusinessHubProfile> {
    const res = await apiClient.put<{ success: boolean; data: { hub: BusinessHubProfile } }>(
      "/admin/business-hub/location",
      data,
    );
    return res.data.data.hub;
  }

  async updateAppearance(appearance: BusinessHubAppearance): Promise<BusinessHubProfile> {
    const res = await apiClient.put<{ success: boolean; data: { hub: BusinessHubProfile } }>(
      "/admin/business-hub/appearance",
      appearance,
    );
    return res.data.data.hub;
  }

  async updateSeo(seo: BusinessHubSeo): Promise<BusinessHubProfile> {
    const res = await apiClient.put<{ success: boolean; data: { hub: BusinessHubProfile } }>(
      "/admin/business-hub/seo",
      seo,
    );
    return res.data.data.hub;
  }

  calculateBusinessStatus(hours: BusinessDayHours[] = []): BusinessStatus {
    return calculateBusinessStatus(hours);
  }

  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await apiClient.get<{ success: boolean; data: { analytics: AnalyticsSummary } }>(
      "/admin/business-hub/analytics",
    );
    return res.data.data.analytics;
  }
}

export const businessHubService = new BusinessHubService();
