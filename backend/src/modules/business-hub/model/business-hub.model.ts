import { model, Schema, type Types } from "mongoose";

import { COLLECTION_NAMES } from "../../../db/constants/collection-names.js";
import { baseSchemaOptions } from "../../../db/schema-options.js";
import type { TimestampedDocument } from "../../../db/types/base-document.types.js";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface BusinessDayHours {
  day: DayOfWeek;
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

export interface BusinessHub extends TimestampedDocument {
  _id: Types.ObjectId;
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

const defaultHours: BusinessDayHours[] = [
  { day: "monday", openTime: "09:00", closeTime: "21:00", isClosed: false },
  { day: "tuesday", openTime: "09:00", closeTime: "21:00", isClosed: false },
  { day: "wednesday", openTime: "09:00", closeTime: "21:00", isClosed: false },
  { day: "thursday", openTime: "09:00", closeTime: "21:00", isClosed: false },
  { day: "friday", openTime: "09:00", closeTime: "21:00", isClosed: false },
  { day: "saturday", openTime: "09:00", closeTime: "21:00", isClosed: false },
  { day: "sunday", openTime: "10:00", closeTime: "20:00", isClosed: false },
];

const businessHubSchema = new Schema<BusinessHub>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
      default: "OneBite Bakery",
    },
    tagline: {
      type: String,
      trim: true,
      default: "Fresh cakes for every special moment.",
    },
    shortDescription: {
      type: String,
      trim: true,
      default: "Your neighborhood artisan bakery creating fresh handcrafted cakes and sweet celebration treats.",
    },
    description: {
      type: String,
      trim: true,
      default: "At OneBite Bakery, every recipe begins with pure ingredients, premium chocolate, and handcrafted passion. From custom designer birthday cakes to artisanal pastries and party celebration combos, we make every sweet moment memorable.",
    },
    logoUrl: {
      type: String,
      trim: true,
      default: "/onebite_logo_full.svg",
    },
    profileImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    coverImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "+91 98765 43210",
    },
    whatsapp: {
      type: String,
      trim: true,
      default: "+919876543210",
    },
    whatsappMessage: {
      type: String,
      trim: true,
      default: "Hello OneBite Bakery, I want to place an order.",
    },
    email: {
      type: String,
      trim: true,
      default: "contact@onebitebakery.in",
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: "/products",
    },
    mapUrl: {
      type: String,
      trim: true,
      default: "https://maps.google.com/?q=OneBite+Bakery",
    },
    address: {
      fullAddress: { type: String, trim: true, default: "OneBite Bakery, Main Market Road" },
      village: { type: String, trim: true, default: "Terha" },
      district: { type: String, trim: true, default: "Unnao" },
      state: { type: String, trim: true, default: "Uttar Pradesh" },
      pincode: { type: String, trim: true, default: "209801" },
    },
    coordinates: {
      latitude: { type: Number, default: 26.5393 },
      longitude: { type: Number, default: 80.4878 },
    },
    social: {
      instagram: { type: String, trim: true, default: "https://instagram.com/onebitebakery" },
      facebook: { type: String, trim: true, default: "" },
      youtube: { type: String, trim: true, default: "" },
      whatsapp: { type: String, trim: true, default: "" },
    },
    businessHours: {
      type: [
        {
          day: {
            type: String,
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            required: true,
          },
          openTime: { type: String, required: true, default: "09:00" },
          closeTime: { type: String, required: true, default: "21:00" },
          isClosed: { type: Boolean, default: false },
          specialNote: { type: String, default: "" },
        },
      ],
      default: defaultHours,
    },
    appearance: {
      theme: {
        type: String,
        enum: ["onebite_premium", "minimal_cream", "pistachio_bakery", "chocolate_cream"],
        default: "onebite_premium",
      },
      buttonStyle: {
        type: String,
        enum: ["rounded-full", "rounded-xl", "rounded-lg", "pill"],
        default: "rounded-xl",
      },
      cardStyle: {
        type: String,
        enum: ["clean", "elevated", "glass", "bordered"],
        default: "elevated",
      },
      borderRadius: {
        type: String,
        enum: ["sm", "md", "lg", "full"],
        default: "lg",
      },
      profileLayout: {
        type: String,
        enum: ["centered", "left", "cover"],
        default: "centered",
      },
    },
    seo: {
      title: { type: String, default: "OneBite Bakery | Digital Business Hub" },
      description: {
        type: String,
        default: "Fresh cakes, handcrafted pastries, custom orders and location details for OneBite Bakery.",
      },
      image: { type: String, default: "/onebite_logo_full.svg" },
      keywords: { type: [String], default: ["OneBite Bakery", "Cakes", "Pastries", "Bakery Hub", "Online Order"] },
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isOfficialVerified: {
      type: Boolean,
      default: true,
    },
    foundedYear: {
      type: String,
      default: "2024",
    },
    businessCategory: {
      type: String,
      default: "Bakery & Confectionery",
    },
  },
  baseSchemaOptions,
);

export const BusinessHubModel = model<BusinessHub>(
  "BusinessHub",
  businessHubSchema,
  COLLECTION_NAMES.BUSINESS_HUB,
);
