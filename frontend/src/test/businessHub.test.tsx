import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import { BusinessHubHeader } from "@/features/business-hub/components/BusinessHubHeader";
import { PrimaryActionButtons } from "@/features/business-hub/components/PrimaryActionButtons";
import { BusinessLinkCard } from "@/features/business-hub/components/BusinessLinkCard";
import { AboutBusinessSection } from "@/features/business-hub/components/AboutBusinessSection";
import { LocationSection } from "@/features/business-hub/components/LocationSection";
import { BusinessHoursModal } from "@/features/business-hub/components/BusinessHoursModal";
import { THEME_CONFIGS } from "@/features/business-hub/theme/themeClasses";
import {
  calculateBusinessStatus,
  type BusinessHubProfile,
  type BusinessLink,
  type BusinessStatus,
} from "@/services/businessHub.service";

const mockProfile: BusinessHubProfile = {
  businessName: "OneBite Bakery",
  tagline: "Made for your sweetest moments.",
  shortDescription: "Artisan bakery in Terha.",
  description: "Specializing in custom cakes, fresh cookies, and celebration treats.",
  logoUrl: "/onebite_logo_full.svg",
  phone: "+91 98765 43210",
  whatsapp: "+919876543210",
  whatsappMessage: "Hello OneBite Bakery, I want to place an order.",
  email: "hello@onebitebakery.in",
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
    facebook: "https://facebook.com/onebitebakery",
    youtube: "https://youtube.com/@onebitebakery",
    whatsapp: "https://wa.me/919876543210",
  },
  businessHours: [
    { day: "monday", openTime: "09:00", closeTime: "21:00", isClosed: false },
    { day: "tuesday", openTime: "09:00", closeTime: "21:00", isClosed: false },
    { day: "wednesday", openTime: "09:00", closeTime: "21:00", isClosed: false },
    { day: "thursday", openTime: "09:00", closeTime: "21:00", isClosed: false },
    { day: "friday", openTime: "09:00", closeTime: "21:00", isClosed: false },
    { day: "saturday", openTime: "09:00", closeTime: "21:00", isClosed: false },
    { day: "sunday", openTime: "10:00", closeTime: "20:00", isClosed: false },
  ],
  appearance: {
    theme: "onebite_premium",
    buttonStyle: "rounded-xl",
    cardStyle: "elevated",
    borderRadius: "lg",
    profileLayout: "centered",
  },
  seo: {
    title: "OneBite Bakery Hub",
    description: "Hub for OneBite Bakery",
  },
  isPublished: true,
  isOfficialVerified: true,
  foundedYear: "2024",
  businessCategory: "Artisan Bakery",
};

const mockStatus: BusinessStatus = {
  isOpen: true,
  statusText: "Open Now",
  currentDay: "monday",
  nextOpenText: "Closes at 21:00",
};

describe("Business Hub Frontend Components", () => {
  const theme = THEME_CONFIGS.onebite_premium;

  describe("BusinessHubHeader", () => {
    it("renders business name, tagline, and verified badge", () => {
      render(
        <BusinessHubHeader
          profile={mockProfile}
          status={mockStatus}
          theme={theme}
          onOpenShare={vi.fn()}
          onOpenHours={vi.fn()}
        />,
      );

      expect(screen.getByText("OneBite Bakery")).toBeInTheDocument();
      expect(screen.getByText("Made for your sweetest moments.")).toBeInTheDocument();
      expect(screen.getByText("Verified")).toBeInTheDocument();
      expect(screen.getByText("Open Now")).toBeInTheDocument();
    });

    it("triggers share and hours callbacks on click", () => {
      const onOpenShare = vi.fn();
      const onOpenHours = vi.fn();

      render(
        <BusinessHubHeader
          profile={mockProfile}
          status={mockStatus}
          theme={theme}
          onOpenShare={onOpenShare}
          onOpenHours={onOpenHours}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /share/i }));
      expect(onOpenShare).toHaveBeenCalled();

      fireEvent.click(screen.getByText("Open Now"));
      expect(onOpenHours).toHaveBeenCalled();
    });
  });

  describe("PrimaryActionButtons", () => {
    it("renders Order Online, WhatsApp, Call, Map, and Instagram buttons", () => {
      render(
        <PrimaryActionButtons
          profile={mockProfile}
          theme={theme}
          borderRadiusClass="rounded-2xl"
        />,
      );

      expect(screen.getByText("Order From Website")).toBeInTheDocument();
      expect(screen.getByText("WhatsApp")).toBeInTheDocument();
      expect(screen.getByText("Call Us")).toBeInTheDocument();
      expect(screen.getByText("Find on Map")).toBeInTheDocument();
      expect(screen.getByText("Instagram")).toBeInTheDocument();
    });

    it("generates correct dynamic WhatsApp URL with encoded message", () => {
      render(
        <PrimaryActionButtons
          profile={mockProfile}
          theme={theme}
          borderRadiusClass="rounded-2xl"
        />,
      );

      const waLink = screen.getByText("WhatsApp").closest("a");
      expect(waLink).toHaveAttribute(
        "href",
        expect.stringContaining("https://wa.me/919876543210"),
      );
    });
  });

  describe("BusinessLinkCard", () => {
    const mockLink: BusinessLink = {
      _id: "link-1",
      title: "🎂 Birthday Cakes Studio",
      description: "Custom handcrafted cakes",
      type: "CATEGORY",
      url: "/categories",
      icon: "Cake",
      isActive: true,
      isFeatured: true,
      openInNewTab: false,
      sortOrder: 1,
      clickCount: 42,
    };

    it("renders title, description, and featured badge", () => {
      render(
        <BusinessLinkCard
          link={mockLink}
          theme={theme}
          borderRadiusClass="rounded-2xl"
        />,
      );

      expect(screen.getByText("🎂 Birthday Cakes Studio")).toBeInTheDocument();
      expect(screen.getByText("Custom handcrafted cakes")).toBeInTheDocument();
      expect(screen.getByText("Featured")).toBeInTheDocument();
    });
  });

  describe("AboutBusinessSection", () => {
    it("renders bakery story, category, and founded year", () => {
      render(
        <AboutBusinessSection
          profile={mockProfile}
          theme={theme}
          borderRadiusClass="rounded-2xl"
        />,
      );

      expect(screen.getByText("About OneBite Bakery")).toBeInTheDocument();
      expect(screen.getByText("Est. 2024")).toBeInTheDocument();
      expect(screen.getByText("Artisan Bakery")).toBeInTheDocument();
      expect(
        screen.getByText(/Specializing in custom cakes, fresh cookies/),
      ).toBeInTheDocument();
    });
  });

  describe("LocationSection", () => {
    it("renders full address and Google Maps button", () => {
      render(
        <LocationSection
          profile={mockProfile}
          theme={theme}
          borderRadiusClass="rounded-2xl"
        />,
      );

      expect(screen.getByText("Location & Directions")).toBeInTheDocument();
      expect(
        screen.getByText(/OneBite Bakery, Main Market Road, Terha, Unnao/),
      ).toBeInTheDocument();
      expect(screen.getByText("Open in Google Maps")).toBeInTheDocument();
    });
  });

  describe("BusinessHoursModal", () => {
    it("renders modal with schedule when open", () => {
      render(
        <BusinessHoursModal
          isOpen={true}
          onClose={vi.fn()}
          hours={mockProfile.businessHours}
          currentDay="monday"
        />,
      );

      expect(screen.getByText("Business Hours")).toBeInTheDocument();
      expect(screen.getByText("Monday")).toBeInTheDocument();
      expect(screen.getByText("Sunday")).toBeInTheDocument();
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      const { container } = render(
        <BusinessHoursModal
          isOpen={false}
          onClose={vi.fn()}
          hours={mockProfile.businessHours}
          currentDay="monday"
        />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("calculateBusinessStatus logic", () => {
    it("returns closed status when day is marked closed", () => {
      const allClosed = mockProfile.businessHours.map((h) => ({
        ...h,
        isClosed: true,
      }));
      const res = calculateBusinessStatus(allClosed);
      expect(res.isOpen).toBe(false);
      expect(res.statusText).toBe("Closed Today");
    });
  });
});
