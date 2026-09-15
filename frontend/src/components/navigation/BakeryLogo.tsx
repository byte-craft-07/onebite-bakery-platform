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
  textColor = "text-[#3B302B]",
}) => {
  const sizeClasses = {
    sm: "h-9 w-9 sm:h-10 sm:w-10",
    md: "h-11 w-11 sm:h-12 sm:w-12 md:h-13 md:w-13",
    lg: "h-16 w-16 sm:h-18 sm:w-18",
    xl: "h-20 w-20 sm:h-24 sm:w-24",
  };

  const textClasses = {
    sm: "text-lg sm:text-xl",
    md: "text-xl sm:text-2xl md:text-3xl",
    lg: "text-2xl sm:text-3xl md:text-4xl",
    xl: "text-3xl sm:text-4xl md:text-5xl",
  };

  return (
    <Link
      to="/"
      className={`group flex items-center gap-2 sm:gap-2.5 select-none transition-transform active:scale-95 ${className}`}
      aria-label="The Online Bakery Home"
    >
      {/* SVG Bakery Emblem Logo */}
      <div className={`relative shrink-0 flex items-center justify-center ${sizeClasses[size]}`}>
        <img
          src="/logo.svg"
          alt="The Online Bakery Emblem"
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="eager"
        />
      </div>

      {/* Brand Name Typography */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span
            className={`font-bakery-display ${textClasses[size]} ${textColor} drop-shadow-xs group-hover:text-[#596B58] transition-colors font-normal whitespace-nowrap`}
            style={{ letterSpacing: "0.01em" }}
          >
            The Online Bakery
          </span>
          <span className="text-[8px] sm:text-[9px] text-[#596B58] font-medium tracking-wide leading-none hidden sm:block">
            Handcrafted with Love &bull; 100% Pure Joy
          </span>
        </div>
      )}
    </Link>
  );
};

