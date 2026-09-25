import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { bannerService, type BannerItem } from "@/services/banner.service";

interface HeroBannerSliderProps {
  autoPlayInterval?: number; // In milliseconds, default 4000ms
  className?: string;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({
  autoPlayInterval = 4000,
  className = "",
}) => {
  const [banners, setBanners] = useState<BannerItem[]>(() => bannerService.getStoredBannersSync());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(() => banners.length === 0);

  // Touch gesture tracking for mobile swipe
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const list = await bannerService.getActiveBanners();
      if (Array.isArray(list)) {
        setBanners(list);
      }
    } catch (_e) {
      // Fallback handled in service
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
    const handleUpdate = () => fetchBanners();
    window.addEventListener("onebitebakery_banners_updated", handleUpdate);
    return () => {
      window.removeEventListener("onebitebakery_banners_updated", handleUpdate);
    };
  }, [fetchBanners]);

  const bannerCount = banners.length;

  // Preload upcoming slides into browser cache
  useEffect(() => {
    if (bannerCount <= 1) return;
    const nextIdx = (currentIndex + 1) % bannerCount;
    const nextBanner = banners[nextIdx];
    if (nextBanner?.desktopImage) {
      const img = new Image();
      img.src = nextBanner.desktopImage;
    }
    if (nextBanner?.mobileImage) {
      const imgMob = new Image();
      imgMob.src = nextBanner.mobileImage;
    }
  }, [currentIndex, banners, bannerCount]);

  const goToNext = useCallback(() => {
    if (bannerCount === 0) return;
    setCurrentIndex((prev) => (prev + 1) % bannerCount);
  }, [bannerCount]);

  const goToPrev = useCallback(() => {
    if (bannerCount === 0) return;
    setCurrentIndex((prev) => (prev - 1 + bannerCount) % bannerCount);
  }, [bannerCount]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play timer
  useEffect(() => {
    if (bannerCount <= 1 || isPaused) return;

    const timer = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [bannerCount, isPaused, autoPlayInterval, goToNext]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      goToNext(); // swipe left -> next
    } else if (diff < -45) {
      goToPrev(); // swipe right -> prev
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (isLoading && bannerCount === 0) {
    return (
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[#FFF8EC] border border-[#E5DEC9] aspect-[16/7] sm:aspect-[21/9] flex items-center justify-center animate-pulse">
        <div className="flex items-center gap-2 text-[#596B58] font-semibold text-xs sm:text-sm">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          <span>Loading posters...</span>
        </div>
      </div>
    );
  }

  if (bannerCount === 0) return null;

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md border border-[#E5DEC9] transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Bakery Hero Posters"
    >
      {/* Full-Bleed Poster Slides Container */}
      <div className="relative w-full aspect-[16/8] xs:aspect-[16/7.5] sm:aspect-[21/9] md:aspect-[21/8.5] lg:aspect-[2.4/1] bg-[#3B302B] overflow-hidden select-none">
        {banners.map((banner, index) => {
          const isCurrent = index === currentIndex;
          const targetUrl = banner.linkUrl || "/products";

          return (
            <div
              key={banner.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isCurrent
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Link
                to={targetUrl}
                title={banner.title || "View Special Offer"}
                className="block w-full h-full cursor-pointer relative"
              >
                <picture>
                  {banner.mobileImage && (
                    <source
                      media="(max-width: 640px)"
                      srcSet={banner.mobileImage}
                    />
                  )}
                  <img
                    src={banner.desktopImage || banner.mobileImage}
                    alt={banner.title || `Bakery Poster ${index + 1}`}
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-[1.01]"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                </picture>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {bannerCount > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Previous Poster"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white shadow-md flex items-center justify-center backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next Poster"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white shadow-md flex items-center justify-center backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-black/40 backdrop-blur-md">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Go to poster ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? "w-5 sm:w-7 h-1.5 sm:h-2 bg-[#D8BE91]"
                    : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
