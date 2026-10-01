import React from "react";
import { ChevronRight, Sparkles } from "lucide-react";

import { businessHubService, type BusinessLink } from "@/services/businessHub.service";
import { BusinessHubIcon } from "./BusinessHubIcon";
import type { ThemeConfig } from "../theme/themeClasses";

interface BusinessLinkCardProps {
  link: BusinessLink;
  theme: ThemeConfig;
  borderRadiusClass: string;
}

export const BusinessLinkCard: React.FC<BusinessLinkCardProps> = ({
  link,
  theme,
  borderRadiusClass,
}) => {
  const handleClick = () => {
    // Non-blocking fire-and-forget click analytics
    businessHubService.trackLinkClick(link._id);
  };

  const isExternal =
    link.url.startsWith("http://") ||
    link.url.startsWith("https://") ||
    link.url.startsWith("tel:") ||
    link.url.startsWith("mailto:");

  return (
    <a
      href={link.url}
      target={link.openInNewTab ? "_blank" : undefined}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer shadow-xs ${borderRadiusClass} ${theme.cardBg} ${theme.cardBorder} ${theme.cardHover} active:scale-[0.99]`}
    >
      {/* Featured Star / Glow Indicator */}
      {link.isFeatured ? (
        <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
          <Sparkles className="w-2.5 h-2.5 text-amber-700" />
          Featured
        </span>
      ) : null}

      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* Thumbnail or Icon */}
        {link.imageUrl ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-neutral-200">
            <img
              src={link.imageUrl}
              alt={link.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-[#3B302B] dark:text-[#FFF8EC] group-hover:scale-110 transition-transform">
            <BusinessHubIcon name={link.icon} className="w-5 h-5 text-current" />
          </div>
        )}

        {/* Title & Description */}
        <div className="min-w-0 text-left">
          <h2 className={`text-sm sm:text-base font-bold truncate leading-snug ${theme.textPrimary}`}>
            {link.title}
          </h2>
          {link.description ? (
            <p className={`text-xs truncate font-medium ${theme.textSecondary}`}>
              {link.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Right Arrow / Action Indicator */}
      <div className="shrink-0 text-neutral-400 group-hover:text-[#3B302B] dark:group-hover:text-[#FFF8EC] group-hover:translate-x-1 transition-all">
        <ChevronRight className="w-5 h-5" />
      </div>
    </a>
  );
};
