import React from "react";
import {
  ShoppingBag,
  MessageCircle,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";

import { InstagramIcon } from "./SocialIcons";
import { businessHubService, type BusinessHubProfile } from "@/services/businessHub.service";
import type { ThemeConfig } from "../theme/themeClasses";

interface PrimaryActionButtonsProps {
  profile: BusinessHubProfile;
  theme: ThemeConfig;
  borderRadiusClass: string;
}

export const PrimaryActionButtons: React.FC<PrimaryActionButtonsProps> = ({
  profile,
  theme,
  borderRadiusClass,
}) => {
  // Generate safe dynamic WhatsApp URL
  const getWhatsAppUrl = () => {
    if (!profile.whatsapp) return "";
    const cleanNumber = profile.whatsapp.replace(/[^0-9]/g, "");
    const encodedMsg = encodeURIComponent(
      profile.whatsappMessage || "Hello OneBite Bakery, I want to place an order.",
    );
    return `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
  };

  const handleActionClick = (
    eventType: "order_website" | "whatsapp" | "call" | "map" | "instagram",
  ) => {
    // Non-blocking fire-and-forget analytics
    businessHubService.trackEvent(eventType);
  };

  const websiteUrl = profile.websiteUrl || "/products";
  const whatsappUrl = getWhatsAppUrl();
  const phoneUrl = profile.phone ? `tel:${profile.phone.replace(/\s+/g, "")}` : "";
  const mapUrl = profile.mapUrl || "https://maps.google.com/?q=OneBite+Bakery";
  const instagramUrl = profile.social?.instagram || "";

  return (
    <section className="w-full space-y-3 pt-2" aria-label="Quick Actions">
      {/* 1. Main Conversion CTA: ORDER ONLINE FROM WEBSITE */}
      {websiteUrl ? (
        <a
          href={websiteUrl}
          onClick={() => handleActionClick("order_website")}
          className={`w-full group flex items-center justify-between px-5 py-4 shadow-md transition-all duration-200 cursor-pointer ${borderRadiusClass} ${theme.primaryBtn} ${theme.primaryBtnText}`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-current animate-bounce-subtle" />
            </div>
            <div className="text-left">
              <span className="block text-base sm:text-lg font-bold tracking-wide leading-tight uppercase">
                Order From Website
              </span>
              <span className="block text-xs opacity-85 font-medium">
                Fresh daily bakes & instant delivery
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 shrink-0" />
        </a>
      ) : null}

      {/* 2 & 3. Quick Connect Grid (WhatsApp & Call) */}
      <div className="grid grid-cols-2 gap-2.5">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleActionClick("whatsapp")}
            className={`flex items-center gap-2.5 px-4 py-3 shadow-xs transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm ${borderRadiusClass}`}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="text-left truncate">
              <span className="block text-xs sm:text-sm font-bold uppercase truncate">
                WhatsApp
              </span>
              <span className="block text-[11px] text-emerald-100 truncate">
                Order directly
              </span>
            </div>
          </a>
        ) : null}

        {phoneUrl ? (
          <a
            href={phoneUrl}
            onClick={() => handleActionClick("call")}
            className={`flex items-center gap-2.5 px-4 py-3 shadow-xs transition-all duration-200 ${theme.secondaryBtn} ${theme.secondaryBtnText} font-semibold text-sm ${borderRadiusClass}`}
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-amber-800 dark:text-amber-300" />
            </div>
            <div className="text-left truncate">
              <span className="block text-xs sm:text-sm font-bold uppercase truncate">
                Call Us
              </span>
              <span className="block text-[11px] opacity-75 truncate">
                {profile.phone || "Quick phone"}
              </span>
            </div>
          </a>
        ) : null}
      </div>

      {/* 4 & 5. Find Us on Map & View Instagram Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleActionClick("map")}
            className={`flex items-center gap-2.5 px-4 py-3 shadow-xs transition-all duration-200 ${theme.secondaryBtn} ${theme.secondaryBtnText} font-semibold text-sm ${borderRadiusClass}`}
          >
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-rose-700 dark:text-rose-300" />
            </div>
            <div className="text-left truncate">
              <span className="block text-xs sm:text-sm font-bold uppercase truncate">
                Find on Map
              </span>
              <span className="block text-[11px] opacity-75 truncate">
                Google Maps
              </span>
            </div>
          </a>
        ) : null}

        {instagramUrl ? (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleActionClick("instagram")}
            className={`flex items-center gap-2.5 px-4 py-3 shadow-xs transition-all duration-200 bg-gradient-to-r from-[#833AB4]/90 via-[#FD1D1D]/90 to-[#FCB045]/90 hover:opacity-95 active:scale-[0.98] text-white font-semibold text-sm ${borderRadiusClass}`}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <InstagramIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left truncate">
              <span className="block text-xs sm:text-sm font-bold uppercase truncate">
                Instagram
              </span>
              <span className="block text-[11px] text-white/90 truncate">
                Follow updates
              </span>
            </div>
          </a>
        ) : null}
      </div>
    </section>
  );
};
