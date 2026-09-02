import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Cake, Gift, Heart, PartyPopper, Sparkles, Star } from "lucide-react";

import { OccasionCard } from "@/components/cards/DomainCards";
import { ProductCard } from "@/components/cards/ProductCard";
import { Badge, EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import { catalogService, type OccasionItem, type ProductItem } from "@/services/catalog.service";
import { useAuth } from "@/contexts/auth.context";

interface OccasionTab {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tagline: string;
  bannerGradient: string;
}

const OCCASION_TABS: OccasionTab[] = [
  {
    id: "all",
    name: "All Occasions",
    slug: "all",
    icon: "🌟",
    tagline: "Explore handcrafted celebration cakes and party treats for every memorable milestone.",
    bannerGradient: "from-[#FFF8EC] via-[#FFF8EC] to-[#F7F2E7]",
  },
  {
    id: "birthday",
    name: "Birthday",
    slug: "birthday",
    icon: "🎂",
    tagline: "Rich Belgian chocolate truffle, pinata, and photo cakes tailored for joyful birthdays.",
    bannerGradient: "from-amber-50 via-orange-50 to-amber-100",
  },
  {
    id: "anniversary",
    name: "Anniversary",
    slug: "anniversary",
    icon: "💖",
    tagline: "Romantic red velvet cream cheese and heart-shaped luxury cakes celebrating true love.",
    bannerGradient: "from-rose-50 via-pink-50 to-rose-100",
  },
  {
    id: "weddings",
    name: "Weddings",
    slug: "weddings",
    icon: "💍",
    tagline: "Majestic multi-tier artisanal centerpiece cakes designed for grand marriage receptions.",
    bannerGradient: "from-purple-50 via-indigo-50 to-purple-100",
  },
  {
    id: "others",
    name: "Others & Parties",
    slug: "others",
    icon: "🎉",
    tagline: "Festive gift hampers, dessert platters, and celebration combos for all special events.",
    bannerGradient: "from-teal-50 via-emerald-50 to-teal-100",
  },
];

export const OccasionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOccasion = searchParams.get("tab") || "all";

  const [selectedTab, setSelectedTab] = useState<string>(initialOccasion);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [occasions, setOccasions] = useState<OccasionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentLocation } = useAuth();

  useEffect(() => {
    catalogService
      .getOccasions()
      .then(setOccasions)
      .catch(() => setOccasions([]));
  }, []);

  const fetchOccasionProducts = async (occasionSlug: string) => {
    setIsLoading(true);
    try {
      const res = await catalogService.searchProducts({
        occasion: occasionSlug === "all" ? undefined : occasionSlug,
        limit: 24,
      });
      setProducts(res.products);
    } catch (_err) {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOccasionProducts(selectedTab);
  }, [selectedTab, currentLocation]);

  const handleTabChange = (tabSlug: string) => {
    setSelectedTab(tabSlug);
    setSearchParams(tabSlug === "all" ? {} : { tab: tabSlug });
  };

  const currentTabInfo = OCCASION_TABS.find((t) => t.slug === selectedTab) || OCCASION_TABS[0];

  return (
    <div className="space-y-8 pb-20">
      {/* Top Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      {/* Main Header Banner */}
      <div className={`rounded-3xl border border-[#E5DEC9] bg-gradient-to-r ${currentTabInfo.bannerGradient} p-6 sm:p-10 text-center space-y-3 shadow-sm transition-all duration-300`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#596B58]/30 text-xs font-bold text-[#596B58] shadow-2xs">
          <span>{currentTabInfo.icon}</span>
          <span>Occasion Special Collection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3B302B] tracking-tight">
          {currentTabInfo.name === "All Occasions" ? "Celebration Occasions" : `${currentTabInfo.name} Cakes & Treats`}
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6E65] max-w-2xl mx-auto leading-relaxed">
          {currentTabInfo.tagline}
        </p>
      </div>

      {/* Interactive Occasion Selector Tabs */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
        {OCCASION_TABS.map((tab) => {
          const isSelected = selectedTab === tab.slug;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.slug)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 ${
                isSelected
                  ? "bg-[#3B302B] text-white ring-2 ring-[#596B58] shadow-md"
                  : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:border-[#596B58] hover:bg-[#FFF8EC]"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filtered Products Count & Info */}
      <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-[#3B302B]">
            {currentTabInfo.name} Products
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF8EC] text-[#596B58] border border-[#596B58]/30">
            {products.length} Items
          </span>
        </div>
        <Link to="/custom-cake" className="text-xs font-bold text-[#596B58] hover:underline flex items-center gap-1">
          <span>Need Custom Design?</span>
        </Link>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 sm:h-80 w-full rounded-2xl sm:rounded-3xl" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Products Found for this Occasion"
          description="Try selecting another occasion tab or browse our complete bakery catalog."
          action={
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className="px-4 py-2 bg-[#596B58] text-white text-xs font-bold rounded-xl hover:bg-[#495948] transition-colors"
            >
              View All Occasions
            </button>
          }
        />
      )}
    </div>
  );
};
