import React from "react";
import { Link } from "react-router-dom";

interface BakeryLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: string;
}

export const BakeryLogo: React.FC<BakeryLogoProps> = ({
  className = "",
  size = "md",
  showText = true,
}) => {
  const emblemSizeClasses = {
    sm: "h-9 w-9 sm:h-10 sm:w-10",
    md: "h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12",
    lg: "h-14 w-14 sm:h-16 sm:w-16",
    xl: "h-18 w-18 sm:h-20 sm:w-20",
  };

  const textHeightClasses = {
    sm: "h-5 sm:h-6 w-auto",
    md: "h-6 sm:h-7 md:h-8 w-auto",
    lg: "h-8 sm:h-9 md:h-10 w-auto",
    xl: "h-10 sm:h-12 md:h-14 w-auto",
  };

  return (
    <Link
      to="/"
      className={`group flex items-center gap-2 sm:gap-2.5 select-none transition-transform active:scale-95 ${className}`}
      aria-label="Onebite Bakery Home"
    >
      {/* SVG Bakery Emblem Logo */}
      <div className={`relative shrink-0 flex items-center justify-center ${emblemSizeClasses[size]}`}>
        <img
          src="/logo.svg"
          alt="Onebite Bakery Emblem"
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="eager"
        />
      </div>

      {/* Brand Name Typography using exact SVG artwork */}
      {showText && (
        <div className="flex flex-col text-left justify-center">
          <img
            src="/onebite_text_only.svg"
            alt="ONEBITE BAKERY"
            className={`${textHeightClasses[size]} object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]`}
            loading="eager"
          />
          <span className="text-[8px] sm:text-[9px] text-[#596B58] font-bold tracking-wider leading-none hidden sm:block mt-0.5">
            Handcrafted with Love &bull; 100% Pure Joy
          </span>
        </div>
      )}
    </Link>
  );
};
