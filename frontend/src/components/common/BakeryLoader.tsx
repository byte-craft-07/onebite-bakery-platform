import React from "react";
import { Sparkles } from "lucide-react";

interface BakeryLoaderProps {
  /** If true, renders a full-screen fixed overlay covering the entire viewport */
  fullScreen?: boolean;
  /** Primary message displayed under the emblem */
  message?: string;
  /** Secondary subtitle or tagline */
  subtext?: string;
  /** Size scale of the emblem and typography */
  size?: "sm" | "md" | "lg";
  /** Optional extra classes */
  className?: string;
}

export const BakeryLoader: React.FC<BakeryLoaderProps> = ({
  fullScreen = false,
  message = "Baking fresh delights...",
  subtext = "Handcrafted with Love • 100% Pure Joy",
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    sm: {
      outerBox: "w-16 h-16",
      innerEmblem: "w-10 h-10",
      logoSize: "w-6 h-6",
      titleText: "text-sm",
      subText: "text-[10px]",
      shimmerWidth: "w-28",
    },
    md: {
      outerBox: "w-24 h-24",
      innerEmblem: "w-16 h-16",
      logoSize: "w-10 h-10",
      titleText: "text-base",
      subText: "text-xs",
      shimmerWidth: "w-40",
    },
    lg: {
      outerBox: "w-32 h-32",
      innerEmblem: "w-20 h-20",
      logoSize: "w-12 h-12",
      titleText: "text-lg",
      subText: "text-sm",
      shimmerWidth: "w-52",
    },
  }[size];

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center select-none text-center ${className}`}
    >
      {/* Central Animated Bakery Icon Container */}
      <div className={`relative flex items-center justify-center ${sizeMap.outerBox} mb-4`}>
        {/* Soft Ambient Radial Halo */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E67E22]/30 via-[#F39C12]/20 to-[#596B58]/25 blur-xl animate-bakery-glow pointer-events-none"
          aria-hidden="true"
        />

        {/* Slow Rotating Golden Dashed Confectionery Ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-[#E67E22]/40 animate-[spin_10s_linear_infinite] pointer-events-none"
          aria-hidden="true"
        />

        {/* Smooth Spinning Confectionery Glaze Spinner */}
        <div
          className="absolute -inset-1 rounded-full border-[3px] border-transparent border-t-[#E67E22] border-r-[#596B58] animate-spin pointer-events-none"
          style={{ animationDuration: "1.1s" }}
          aria-hidden="true"
        />

        {/* Floating Steam Ribbons from Fresh Baking */}
        <div
          className="absolute -top-4 inset-x-0 flex justify-center gap-1.5 pointer-events-none"
          aria-hidden="true"
        >
          <span className="w-1 h-3.5 bg-gradient-to-t from-[#E67E22]/50 to-transparent rounded-full animate-bakery-steam-1" />
          <span className="w-1 h-4 bg-gradient-to-t from-[#D35400]/50 to-transparent rounded-full animate-bakery-steam-2" />
          <span className="w-1 h-3.5 bg-gradient-to-t from-[#596B58]/50 to-transparent rounded-full animate-bakery-steam-3" />
        </div>

        {/* Sparkle Badges */}
        <div
          className="absolute -top-1 -right-1 z-10 text-[#E67E22] animate-bounce pointer-events-none"
          style={{ animationDuration: "2.4s" }}
          aria-hidden="true"
        >
          <Sparkles className="w-4 h-4 fill-[#E67E22]/20" />
        </div>

        {/* Central Pure Cream Card with Bakery Logo */}
        <div
          className={`relative z-10 rounded-full bg-white flex items-center justify-center shadow-[0_6px_20px_rgba(230,126,34,0.18)] border border-[#E5DEC9] ${sizeMap.innerEmblem} animate-bakery-float`}
        >
          <img
            src="/logo.svg"
            alt="Onebite Bakery"
            className={`${sizeMap.logoSize} object-contain transition-transform`}
            loading="eager"
            onError={(e) => {
              // Fallback to cute cupcake SVG icon if logo fails to load
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement("span");
                fallback.className = "text-xl select-none";
                fallback.innerText = "🧁";
                parent.appendChild(fallback);
              }
            }}
          />
        </div>
      </div>

      {/* Brand Header */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#596B58]">
          <span className="h-0.5 w-3 bg-[#596B58]/40 rounded-full" />
          <span>Onebite Bakery</span>
          <span className="h-0.5 w-3 bg-[#596B58]/40 rounded-full" />
        </div>

        {/* Primary Animated Message with Bouncing Dots */}
        <div className="mt-1.5 flex items-center justify-center gap-1 font-bold text-[#2C1E16]">
          <span className={`${sizeMap.titleText} font-semibold tracking-tight text-[#2C1E16]`}>
            {message}
          </span>
          <span className="inline-flex items-center gap-0.5 ml-0.5" aria-hidden="true">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#E67E22] animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "1s" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#D35400] animate-bounce"
              style={{ animationDelay: "180ms", animationDuration: "1s" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#596B58] animate-bounce"
              style={{ animationDelay: "360ms", animationDuration: "1s" }}
            />
          </span>
        </div>

        {/* Caramel Shimmer Progress Bar */}
        <div
          className={`relative ${sizeMap.shimmerWidth} h-1 mt-3 bg-[#E5DEC9]/60 rounded-full overflow-hidden`}
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-[#E67E22] to-transparent rounded-full animate-bakery-shimmer" />
        </div>

        {/* Subtitle / Tagline */}
        {subtext && (
          <p className={`mt-2 ${sizeMap.subText} font-medium text-[#7A6E65] tracking-wide`}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFBF5]/95 backdrop-blur-sm p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[45vh] w-full items-center justify-center p-6">
      {content}
    </div>
  );
};

export const FullScreenLoader: React.FC<{
  message?: string;
  subtext?: string;
}> = ({ message = "Loading...", subtext }) => {
  return (
    <BakeryLoader
      fullScreen={true}
      size="md"
      message={message}
      subtext={subtext}
    />
  );
};

export const InlineLoader: React.FC<{
  message?: string;
  size?: "sm" | "md";
}> = ({ message = "Loading...", size = "sm" }) => {
  return (
    <BakeryLoader
      fullScreen={false}
      size={size}
      message={message}
      subtext=""
      className="py-4"
    />
  );
};

export default BakeryLoader;
