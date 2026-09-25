import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MapPin, Sparkles, Tag, Ticket } from "lucide-react";

import { useAuth } from "@/contexts/auth.context";
import { LocationModal } from "@/components/location/LocationModal";

export const MobileHeroQuickBar: React.FC = () => {
  const { currentLocation } = useAuth();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  return (
    <>
      <div className="w-full space-y-2.5 my-2 sm:my-3">
        {/* Row 1 — 3 Top Feature Cards (Centered vertical icon + clean crisp label) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* 1. Bakery Card */}
          <Link
            to="/products"
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs hover:shadow-xs transition-all active:scale-95 group text-center min-h-[78px]"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9]/60 flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-110 transition-transform mb-1">
              🎂
            </div>
            <span className="font-extrabold text-[11px] sm:text-xs text-[#3B302B] leading-tight tracking-tight">
              Bakery
            </span>
          </Link>

          {/* 2. Custom Cake Card */}
          <Link
            to="/custom-cake"
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs hover:shadow-xs transition-all active:scale-95 group text-center min-h-[78px]"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9]/60 flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-110 transition-transform mb-1">
              🍰
            </div>
            <span className="font-extrabold text-[11px] sm:text-xs text-[#3B302B] leading-tight tracking-tight whitespace-nowrap">
              Custom Cake
            </span>
          </Link>

          {/* 3. Decorations Card */}
          <Link
            to="/decorations"
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs hover:shadow-xs transition-all active:scale-95 group text-center min-h-[78px]"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9]/60 flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-110 transition-transform mb-1">
              🎉
            </div>
            <span className="font-extrabold text-[11px] sm:text-xs text-[#3B302B] leading-tight tracking-tight whitespace-nowrap">
              Decorations
            </span>
          </Link>
        </div>

        {/* Row 2 — Delivery Village / Address Selector & Deals Link */}
        <div className="flex items-center gap-2">
          {/* Address Dropdown Pill */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs hover:bg-[#F7F2E7] transition-all cursor-pointer group active:scale-98 min-h-[46px]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-[#596B58] text-[#FFF8EC] shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className={`font-bold text-xs truncate text-left ${currentLocation?.villageName ? "text-[#3B302B]" : "text-amber-800"}`}>
                {currentLocation?.villageName
                  ? `${currentLocation.villageName}${currentLocation.district ? `, ${currentLocation.district}` : ""}`
                  : "Select Delivery Address"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-[#7A6E65] shrink-0 ml-1 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Offers Link Pill */}
          <Link
            to="/offers"
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-[#D8BE91]/25 border border-[#D8BE91] shadow-2xs hover:bg-[#D8BE91]/40 transition-all cursor-pointer group active:scale-98 shrink-0 min-h-[46px]"
          >
            <span className="text-base group-hover:rotate-12 transition-transform">🎟️</span>
            <span className="font-extrabold text-xs text-[#3B302B]">Offers</span>
          </Link>
        </div>
      </div>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
};
