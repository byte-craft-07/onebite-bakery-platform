import { z } from "zod";
import { LINK_TYPES } from "../model/business-link.model.js";

// Safe URL validator that strictly rejects javascript:, data:, and invalid schemes
export const safeUrlValidator = z
  .string()
  .trim()
  .refine(
    (url) => {
      if (!url) return false;
      const lower = url.toLowerCase().trim();
      if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:") ||
        lower.startsWith("vbscript:")
      ) {
        return false;
      }
      if (lower.startsWith("/") || lower.startsWith("#")) {
        return true;
      }
      try {
        const parsed = new URL(url);
        return ["http:", "https:", "tel:", "mailto:"].includes(parsed.protocol);
      } catch {
        // Allow relative paths or standard scheme prefixes
        return /^(https?:\/\/|tel:|mailto:|\/|#)/i.test(url);
      }
    },
    { message: "Invalid or unsafe URL format. Allowed protocols: http, https, tel, mailto, or relative path." },
  );

export const createBusinessLinkSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().trim().max(250).optional().default(""),
  type: z.enum(LINK_TYPES),
  url: safeUrlValidator,
  icon: z.string().trim().max(50).optional().default(""),
  imageUrl: z.string().trim().max(500).optional().default(""),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  openInNewTab: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateBusinessLinkSchema = createBusinessLinkSchema.partial();

export const reorderLinksSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "At least one ID must be provided"),
});

export const dayHoursSchema = z.object({
  day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
  isClosed: z.boolean(),
  specialNote: z.string().max(100).optional().default(""),
});

export const updateBusinessHoursSchema = z.object({
  businessHours: z.array(dayHoursSchema).length(7, "All 7 days must be configured"),
});

export const updateBusinessProfileSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(100),
  tagline: z.string().trim().max(150).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  logoUrl: z.string().trim().optional(),
  profileImageUrl: z.string().trim().optional(),
  coverImageUrl: z.string().trim().optional(),
  phone: z.string().trim().max(25).optional(),
  whatsapp: z.string().trim().max(25).optional(),
  whatsappMessage: z.string().trim().max(200).optional(),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
  websiteUrl: safeUrlValidator.optional(),
  mapUrl: safeUrlValidator.optional(),
  isPublished: z.boolean().optional(),
  isOfficialVerified: z.boolean().optional(),
  foundedYear: z.string().trim().max(10).optional(),
  businessCategory: z.string().trim().max(60).optional(),
});

export const updateSocialSchema = z.object({
  instagram: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  youtube: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
});

export const updateLocationSchema = z.object({
  mapUrl: safeUrlValidator.optional(),
  address: z.object({
    fullAddress: z.string().trim().max(250),
    village: z.string().trim().max(100),
    district: z.string().trim().max(100),
    state: z.string().trim().max(100),
    pincode: z.string().trim().max(10),
  }),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

export const updateAppearanceSchema = z.object({
  theme: z.enum(["onebite_premium", "minimal_cream", "pistachio_bakery", "chocolate_cream"]),
  buttonStyle: z.enum(["rounded-full", "rounded-xl", "rounded-lg", "pill"]),
  cardStyle: z.enum(["clean", "elevated", "glass", "bordered"]),
  borderRadius: z.enum(["sm", "md", "lg", "full"]),
  profileLayout: z.enum(["centered", "left", "cover"]),
});

export const updateSeoSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(300),
  image: z.string().trim().optional(),
  keywords: z.array(z.string().trim()).optional(),
});

export const trackEventSchema = z.object({
  linkId: z.string().optional(),
  eventType: z.enum([
    "page_view",
    "order_website",
    "whatsapp",
    "call",
    "map",
    "instagram",
    "custom_link",
    "share",
  ]),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).optional().default("mobile"),
  referrer: z.string().max(500).optional().default(""),
});
