import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BakeryLoader } from "@/components/common/BakeryLoader";
import {
  businessHubService,
  type PublicHubData,
} from "@/services/businessHub.service";
import { SEOHead, buildLocalBusinessSchema } from "@/components/seo";
import { THEME_CONFIGS } from "../theme/themeClasses";
import { BusinessHubHeader } from "../components/BusinessHubHeader";
import { PrimaryActionButtons } from "../components/PrimaryActionButtons";
import { BusinessLinkCard } from "../components/BusinessLinkCard";
import { AboutBusinessSection } from "../components/AboutBusinessSection";
import { LocationSection } from "../components/LocationSection";
import { SocialBar } from "../components/SocialBar";
import { ShareModal } from "../components/ShareModal";
import { BusinessHoursModal } from "../components/BusinessHoursModal";

export const PublicBusinessHubPage: React.FC = () => {
  const [data, setData] = useState<PublicHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHoursOpen, setIsHoursOpen] = useState(false);

  const fetchHubData = async () => {
    try {
      setLoading(true);
      setError(null);
      const hubData = await businessHubService.getPublicHub();
      setData(hubData);

      // Track page view event once loaded
      businessHubService.trackEvent("page_view");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load business profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  const handleShareTrigger = async () => {
    if (!data) return;
    const shareUrl = window.location.href;
    const shareData = {
      title: data.hub.businessName,
      text: data.hub.tagline,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        businessHubService.trackEvent("share");
        return;
      } catch {
        // Fallback to modal if canceled or errored
      }
    }
    setIsShareOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <BakeryLoader
          fullScreen={false}
          message="Welcome to OneBite Bakery"
          subtext="Loading digital business hub..."
          size="md"
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <SEOHead title="Business Hub | OneBite Bakery" noindex={true} nofollow={true} />
        <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-md border border-[#EFE8DF] text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-800 text-2xl font-bold">
            🍰
          </div>
          <h2 className="text-xl font-bold text-[#3B302B]">
            Unable to Load Profile
          </h2>
          <p className="text-sm text-[#7A6B63]">
            {error || "Business profile is currently unavailable."}
          </p>
          <button
            type="button"
            onClick={fetchHubData}
            className="px-6 py-2.5 rounded-full bg-[#3B302B] text-white font-semibold text-sm hover:bg-[#28211D] transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { hub, links, status } = data;
  const currentTheme = THEME_CONFIGS[hub.appearance?.theme || "onebite_premium"] || THEME_CONFIGS.onebite_premium;

  const borderRadiusMap: Record<string, string> = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    full: "rounded-3xl",
  };
  const borderRadiusClass = borderRadiusMap[hub.appearance?.borderRadius || "lg"] || "rounded-2xl";

  const currentYear = new Date().getFullYear();

  return (
    <div
      className={`min-h-screen ${currentTheme.containerBg} flex flex-col justify-between py-6 sm:py-10 px-4 transition-colors duration-300 font-sans`}
    >
      <SEOHead
        title={hub.seo?.title || `${hub.businessName} | Digital Business Hub`}
        description={
          hub.seo?.description ||
          hub.shortDescription ||
          hub.tagline ||
          "Official digital business profile, direct orders, location, and social links for OneBite Bakery."
        }
        canonicalUrl="/business"
        structuredData={buildLocalBusinessSchema()}
      />
      {/* Centered Business Hub Profile Card */}
      <main className="w-full max-w-lg mx-auto space-y-6">
        {/* Brand Header & Open/Closed Status */}
        <BusinessHubHeader
          profile={hub}
          status={status}
          theme={currentTheme}
          onOpenShare={handleShareTrigger}
          onOpenHours={() => setIsHoursOpen(true)}
        />

        {/* Primary Action Buttons (Order, WhatsApp, Call, Map, Instagram) */}
        <PrimaryActionButtons
          profile={hub}
          theme={currentTheme}
          borderRadiusClass={borderRadiusClass}
        />

        {/* Secondary Custom Business Links List */}
        {links.length > 0 ? (
          <section className="space-y-2.5 pt-2" aria-label="Quick Links">
            {links.map((link) => (
              <BusinessLinkCard
                key={link._id}
                link={link}
                theme={currentTheme}
                borderRadiusClass={borderRadiusClass}
              />
            ))}
          </section>
        ) : null}

        {/* About Section */}
        <AboutBusinessSection
          profile={hub}
          theme={currentTheme}
          borderRadiusClass={borderRadiusClass}
        />

        {/* Location & Directions Card */}
        <LocationSection
          profile={hub}
          theme={currentTheme}
          borderRadiusClass={borderRadiusClass}
        />

        {/* Social Media Channels */}
        <SocialBar
          social={hub.social}
          whatsappNumber={hub.whatsapp}
          businessName={hub.businessName}
        />

        {/* Dynamic Footer */}
        <footer className="pt-6 pb-4 text-center space-y-2 border-t border-stone-200/60 dark:border-stone-800">
          <p className="text-xs font-bold tracking-wider uppercase text-stone-500">
            {hub.businessName}
          </p>
          <p className="text-xs text-stone-400">
            Freshly made for your special moments.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-stone-400 pt-1">
            <Link to="/products" className="hover:text-stone-700 underline">
              Catalog
            </Link>
            <span>•</span>
            <Link to="/about" className="hover:text-stone-700 underline">
              About
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-stone-700 underline">
              Contact
            </Link>
          </div>
          <p className="text-[11px] text-stone-400 pt-2">
            © {currentYear} {hub.businessName}. All rights reserved.
          </p>
        </footer>
      </main>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        businessName={hub.businessName}
        tagline={hub.tagline}
        shareUrl={typeof window !== "undefined" ? window.location.href : ""}
      />

      {/* Business Hours Modal Dialog */}
      <BusinessHoursModal
        isOpen={isHoursOpen}
        onClose={() => setIsHoursOpen(false)}
        hours={hub.businessHours}
        currentDay={status.currentDay}
      />
    </div>
  );
};
