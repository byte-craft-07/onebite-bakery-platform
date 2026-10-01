import React from "react";
import { MapPin, ExternalLink, Navigation } from "lucide-react";

import { businessHubService, type BusinessHubProfile } from "@/services/businessHub.service";
import type { ThemeConfig } from "../theme/themeClasses";

interface LocationSectionProps {
  profile: BusinessHubProfile;
  theme: ThemeConfig;
  borderRadiusClass: string;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  profile,
  theme,
  borderRadiusClass,
}) => {
  const { address, mapUrl } = profile;
  if (!address && !mapUrl) return null;

  const handleMapClick = () => {
    businessHubService.trackEvent("map");
  };

  const addressString = [
    address?.fullAddress,
    address?.village,
    address?.district,
    address?.state ? `${address.state} - ${address.pincode || ""}` : address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const targetMapUrl = mapUrl || `https://maps.google.com/?q=${encodeURIComponent(addressString || profile.businessName)}`;

  return (
    <section
      aria-label="Bakery Location"
      className={`p-5 sm:p-6 border shadow-xs space-y-4 text-left ${borderRadiusClass} ${theme.cardBg} ${theme.cardBorder}`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${theme.textPrimary}`}>
          <MapPin className="w-4 h-4 text-rose-600" />
          Location & Directions
        </h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          Bakery Store
        </span>
      </div>

      <div className="space-y-1">
        <p className={`text-sm font-semibold ${theme.textPrimary}`}>
          {profile.businessName}
        </p>
        <p className={`text-xs sm:text-sm leading-relaxed ${theme.textSecondary}`}>
          {addressString || "Main Market Road, Uttar Pradesh"}
        </p>
      </div>

      <a
        href={targetMapUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleMapClick}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-xs ${borderRadiusClass} ${theme.secondaryBtn} ${theme.secondaryBtnText}`}
      >
        <Navigation className="w-4 h-4 text-rose-600" />
        <span>Open in Google Maps</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
      </a>
    </section>
  );
};
