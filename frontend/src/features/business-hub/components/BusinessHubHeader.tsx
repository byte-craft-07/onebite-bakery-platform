import React, { useState } from "react";
import { BadgeCheck, Clock, Share2 } from "lucide-react";

import type { BusinessHubProfile, BusinessStatus } from "@/services/businessHub.service";
import type { ThemeConfig } from "../theme/themeClasses";

interface BusinessHubHeaderProps {
  profile: BusinessHubProfile;
  status: BusinessStatus;
  theme: ThemeConfig;
  onOpenShare: () => void;
  onOpenHours: () => void;
}

export const BusinessHubHeader: React.FC<BusinessHubHeaderProps> = ({
  profile,
  status,
  theme,
  onOpenShare,
  onOpenHours,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const fallbackLogo = "/onebite_logo_full.svg";

  return (
    <header className="relative w-full text-center">
      {/* Cover Banner (if provided) */}
      {profile.coverImageUrl && !coverError ? (
        <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden mb-[-48px] shadow-sm">
          <img
            src={profile.coverImageUrl}
            alt={`${profile.businessName} cover`}
            className="w-full h-full object-cover"
            onError={() => setCoverError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        </div>
      ) : null}

      {/* Top Action Bar (Share Button) */}
      <div className="flex justify-end items-center mb-2 px-2">
        <button
          type="button"
          onClick={onOpenShare}
          aria-label="Share Business Profile"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-white/80 dark:bg-black/30 border border-[#E8DFC8]/70 text-[#3B302B] hover:bg-white hover:shadow-sm transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {/* Brand Logo Avatar */}
      <div className="flex justify-center mb-3">
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-white shadow-md border border-[#EFE8DF] overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <img
              src={logoError ? fallbackLogo : profile.logoUrl || fallbackLogo}
              alt={profile.businessName}
              className="w-full h-full object-contain p-1.5 rounded-xl"
              onError={() => setLogoError(true)}
              loading="eager"
            />
          </div>
          {profile.isOfficialVerified ? (
            <div
              className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 shadow-md border-2 border-white flex items-center justify-center"
              title="Official Verified Business"
              aria-label="Official Verified Business"
            >
              <BadgeCheck className="w-4 h-4" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Business Name & Verification */}
      <div className="space-y-1 px-4">
        <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.textPrimary}`}>
            {profile.businessName}
          </h1>
          {profile.isOfficialVerified ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BadgeCheck className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          ) : null}
        </div>

        {/* Tagline */}
        {profile.tagline ? (
          <p className={`text-sm sm:text-base font-medium max-w-md mx-auto ${theme.textSecondary}`}>
            {profile.tagline}
          </p>
        ) : null}

        {/* Open / Closed Status Pill (Clickable to view full schedule) */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={onOpenHours}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs hover:opacity-90 active:scale-95 cursor-pointer bg-white"
            style={{
              borderColor: status.isOpen ? "#BBF7D0" : "#FED7AA",
            }}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                status.isOpen ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span
              className={`font-bold ${
                status.isOpen ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {status.statusText}
            </span>
            {status.nextOpenText ? (
              <span className="text-[#8C7A70] font-normal border-l border-neutral-200 pl-2">
                {status.nextOpenText}
              </span>
            ) : null}
            <Clock className="w-3 h-3 text-[#A8988D] ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
