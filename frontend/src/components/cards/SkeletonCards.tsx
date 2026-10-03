import React from "react";
import { cn } from "@/utils/cn";

/**
 * Shimmer sheen component to add animated luxury glow across skeleton items
 */
export const ShimmerSheen: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-bakery-shimmer pointer-events-none z-10",
      className
    )}
  />
);

/**
 * Category Card Skeleton - matches the exact aspect ratio, rounded corners, and layout of CategoryCard
 */
export const CategoryCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden aspect-square sm:aspect-4/3 border border-[#E5DEC9] bg-[#F7F2E7] flex flex-col justify-end p-3 sm:p-5 shadow-2xs",
        className
      )}
    >
      <ShimmerSheen />
      
      {/* Background pseudo image area */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent" />

      {/* Content Placeholders */}
      <div className="relative z-10 space-y-2">
        <div className="h-4 sm:h-5 w-3/4 rounded-lg bg-[#E2D7C5] animate-pulse" />
        <div className="h-3 w-1/3 rounded-md bg-[#E2D7C5]/70 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Product Card Skeleton - matches the exact dimensions, image container, tags, title, price, and CTA buttons of ProductCard
 */
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-[#E5DEC9] bg-white overflow-hidden shadow-[0_2px_12px_rgba(59,48,43,0.04)] flex flex-col justify-between select-none",
        className
      )}
    >
      {/* Top Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF6EE]">
        <ShimmerSheen />

        {/* Top-Left Indian Vegetarian Mark Placeholder */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 p-[3px] rounded-md shadow-xs flex items-center justify-center">
          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-[1.5px] border-[#D8CEBC] rounded-xs flex items-center justify-center p-[1.5px]">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#D8CEBC]" />
          </div>
        </div>

        {/* Top-Right Badge Placeholder */}
        <div className="absolute top-2 right-2 z-10 h-5 w-24 rounded-full bg-[#E5DEC9]/80 shadow-xs animate-pulse" />

        {/* Bottom-Left Badge Placeholder */}
        <div className="absolute bottom-2 left-2 z-10 h-4 w-16 rounded-md bg-[#E5DEC9]/80 shadow-xs animate-pulse" />
      </div>

      {/* Body Information Section */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-2">
          {/* Title Placeholder */}
          <div className="space-y-1">
            <div className="h-3.5 sm:h-4 w-4/5 rounded bg-[#E5DEC9] animate-pulse" />
            <div className="h-3.5 sm:h-4 w-2/5 rounded bg-[#E5DEC9]/60 animate-pulse" />
          </div>

          {/* Price & Heart Row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {/* Main Price */}
              <div className="h-4 sm:h-5 w-14 rounded bg-[#E5DEC9] animate-pulse" />
              {/* Compare Price */}
              <div className="h-3 sm:h-3.5 w-10 rounded bg-[#E5DEC9]/50 animate-pulse" />
              {/* Discount Tag */}
              <div className="h-3.5 w-12 rounded bg-[#596B58]/15 animate-pulse" />
            </div>

            {/* Heart Button Placeholder */}
            <div className="h-5 w-5 rounded-full bg-[#E5DEC9]/60 animate-pulse shrink-0" />
          </div>

          {/* Dynamic Rating Line Placeholder */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="h-3 w-6 rounded bg-[#E5DEC9] animate-pulse" />
            <div className="h-3 w-3 rounded-full bg-amber-200/90 animate-pulse" />
            <div className="h-3 w-16 rounded bg-[#E5DEC9]/60 animate-pulse" />
          </div>
        </div>

        {/* Action Buttons Grid Placeholder */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#E5DEC9]">
          {/* Add to Cart Button */}
          <div className="h-[34px] sm:h-[38px] rounded-full bg-[#F3ECE0] border border-[#E5DEC9] relative overflow-hidden flex items-center justify-center">
            <ShimmerSheen />
            <div className="h-3 w-12 rounded bg-[#D8CEBC]/70 animate-pulse" />
          </div>
          {/* Order Now Button */}
          <div className="h-[34px] sm:h-[38px] rounded-full bg-[#596B58]/25 relative overflow-hidden flex items-center justify-center">
            <ShimmerSheen />
            <div className="h-3 w-14 rounded bg-[#596B58]/40 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Combo Card Skeleton - matches the exact 2-column horizontal layout and bullet points of ComboCard
 */
export const ComboCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E5DEC9] bg-white p-4 sm:p-6 shadow-2xs flex flex-col md:flex-row gap-4 sm:gap-6 items-center relative overflow-hidden",
        className
      )}
    >
      <ShimmerSheen />

      {/* Left Image Area */}
      <div className="w-full md:w-1/3 aspect-4/3 rounded-xl bg-[#FAF6EE] relative overflow-hidden shrink-0 border border-[#E5DEC9]/60">
        <ShimmerSheen />
      </div>

      {/* Right Details Area */}
      <div className="w-full md:w-2/3 space-y-3.5">
        <div className="h-5 sm:h-6 w-3/4 rounded-lg bg-[#E5DEC9] animate-pulse" />

        {/* 3 Combo Bullet Items */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full bg-[#596B58]/25 shrink-0" />
            <div className="h-3.5 w-4/5 rounded bg-[#E5DEC9]/70 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full bg-[#596B58]/25 shrink-0" />
            <div className="h-3.5 w-3/5 rounded bg-[#E5DEC9]/70 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full bg-[#596B58]/25 shrink-0" />
            <div className="h-3.5 w-2/3 rounded bg-[#E5DEC9]/70 animate-pulse" />
          </div>
        </div>

        {/* Bottom Pricing & CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-[#E5DEC9] gap-3">
          <div className="flex items-baseline gap-2">
            <div className="h-6 w-20 rounded bg-[#E5DEC9] animate-pulse" />
            <div className="h-3.5 w-12 rounded bg-[#E5DEC9]/50 animate-pulse" />
          </div>

          <div className="h-9 w-full sm:w-36 rounded-xl bg-[#596B58]/30 relative overflow-hidden flex items-center justify-center">
            <ShimmerSheen />
            <div className="h-3.5 w-20 rounded bg-white/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Occasion Card Skeleton - matches the exact aspect ratio and look of OccasionCard
 */
export const OccasionCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden aspect-square sm:aspect-3/2 border border-[#E5DEC9] bg-[#F7F2E7] shadow-2xs flex flex-col justify-end p-3 sm:p-5",
        className
      )}
    >
      <ShimmerSheen />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
      <div className="relative z-10 space-y-2">
        <div className="h-4 sm:h-5 w-3/4 rounded-lg bg-[#E2D7C5] animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-[#E2D7C5]/70 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Review Card Skeleton - matches ReviewCard
 */
export const ReviewCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E5DEC9] bg-white p-4 sm:p-5 shadow-2xs space-y-3 min-w-[270px] sm:min-w-[290px] md:min-w-[320px] shrink-0 flex flex-col justify-between relative overflow-hidden",
        className
      )}
    >
      <ShimmerSheen />
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#E5DEC9] animate-pulse shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-[#E5DEC9] animate-pulse" />
              <div className="h-2.5 w-14 rounded bg-amber-200/80 animate-pulse" />
            </div>
          </div>
          <div className="h-5 w-20 rounded-full bg-[#596B58]/15 animate-pulse shrink-0" />
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="h-3 w-full rounded bg-[#E5DEC9]/70 animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-[#E5DEC9]/70 animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#E5DEC9]/60">
        <div className="h-2.5 w-24 rounded bg-[#596B58]/20 animate-pulse" />
        <div className="h-2.5 w-14 rounded bg-[#E5DEC9]/50 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Category Filter Pills Skeleton
 */
export const CategoryPillSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const widths = ["w-20", "w-24", "w-16", "w-28", "w-20", "w-24"];
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "h-8 rounded-full bg-[#E5DEC9]/75 animate-pulse shrink-0 border border-[#E5DEC9]/50 relative overflow-hidden",
            widths[idx % widths.length]
          )}
        >
          <ShimmerSheen />
        </div>
      ))}
    </div>
  );
};
