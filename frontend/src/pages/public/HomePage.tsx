import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Cake, Clock, Gift, PartyPopper, ShieldCheck, Sparkles, Star, Tag, Zap } from "lucide-react";

import { CategoryCard, ComboCard, OccasionCard, ReviewCard } from "@/components/cards/DomainCards";
import { ProductCard } from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/Button";
import { RatingModal } from "@/components/review/RatingModal";
import { MOCK_COMBOS, MOCK_PRODUCTS, type MockReview } from "@/data/mockData";
import { catalogService, type CategoryItem, type OccasionItem, type ProductItem } from "@/services/catalog.service";
import { comboService, type Combo } from "@/services/combo.service";
import { useAuth } from "@/contexts/auth.context";
import { reviewService } from "@/services/review.service";
import { MobileHeroQuickBar } from "@/components/navigation/MobileHeroQuickBar";
import { ContactUsFloatingButton } from "@/components/common/ContactUsFloatingButton";
import { HeroBannerSlider } from "@/components/home/HeroBannerSlider";

export const HomePage: React.FC = () => {
  const { currentLocation } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [occasions, setOccasions] = useState<OccasionItem[]>([]);
  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHomeData = async () => {
    setIsLoading(true);
    try {
      const [catList, prodRes, occList, revList, comboList] = await Promise.all([
        catalogService.getCategories(),
        catalogService.searchProducts({ limit: 20 }),
        catalogService.getOccasions(),
        reviewService.getReviews(),
        comboService.getCombos().catch(() => []),
      ]);
      setCategories(catList);
      setAllProducts(prodRes.products.length > 0 ? prodRes.products : (MOCK_PRODUCTS as unknown as ProductItem[]));
      setOccasions(occList);
      setReviews(revList);
      setCombos(comboList && comboList.length > 0 ? comboList : (MOCK_COMBOS as unknown as Combo[]));
    } catch (_err) {
      setAllProducts(MOCK_PRODUCTS as unknown as ProductItem[]);
      setCombos(MOCK_COMBOS as unknown as Combo[]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
    const handleLocationChange = () => {
      fetchHomeData();
    };
    window.addEventListener("theonlinebakery_review_submitted", fetchHomeData);
    window.addEventListener("theonlinebakery_location_changed", handleLocationChange);
    return () => {
      window.removeEventListener("theonlinebakery_review_submitted", fetchHomeData);
      window.removeEventListener("theonlinebakery_location_changed", handleLocationChange);
    };
  }, [currentLocation]);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
      : "4.9";

  // Filtered Products for the dynamic tab
  const filteredProducts = allProducts.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "cakes") {
      return (
        p.name.toLowerCase().includes("cake") ||
        (p.categoryId?.name || "").toLowerCase().includes("cake")
      );
    }
    if (activeTab === "pastries") {
      return (
        p.name.toLowerCase().includes("tart") ||
        p.name.toLowerCase().includes("croissant") ||
        p.name.toLowerCase().includes("bread") ||
        p.name.toLowerCase().includes("pastry") ||
        (p.categoryId?.name || "").toLowerCase().includes("pastr") ||
        (p.categoryId?.name || "").toLowerCase().includes("bread")
      );
    }
    if (activeTab === "decorations") {
      return (
        p.name.toLowerCase().includes("candle") ||
        p.name.toLowerCase().includes("balloon") ||
        p.name.toLowerCase().includes("topper") ||
        p.name.toLowerCase().includes("popper") ||
        p.name.toLowerCase().includes("decor") ||
        (p.categoryId?.name || "").toLowerCase().includes("decor")
      );
    }
    return true;
  });

  const decorationProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes("candle") ||
    p.name.toLowerCase().includes("balloon") ||
    p.name.toLowerCase().includes("topper") ||
    p.name.toLowerCase().includes("popper") ||
    p.name.toLowerCase().includes("decor") ||
    (p.categoryId?.name || "").toLowerCase().includes("decor")
  );

  return (
    <div className="space-y-8 sm:space-y-14 md:space-y-16 pb-16">
      {/* Mobile Top Category & Location Bar (Matching Reference Layout) */}
      <div className="block lg:hidden">
        <MobileHeroQuickBar />
      </div>

      {/* Auto-Changing Responsive Hero Banner Posters */}
      <HeroBannerSlider autoPlayInterval={4500} />

      {/* Featured Categories Section */}
      <section className="space-y-4 sm:space-y-8">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#3B302B]">Browse Categories</h2>
            <p className="text-[11px] sm:text-sm text-[#7A6E65] mt-0.5 sm:mt-1">Explore our complete range of baked goods & party items</p>
          </div>
          <Link to="/categories" className="text-xs sm:text-sm font-bold text-[#596B58] hover:underline flex items-center gap-1 shrink-0">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={{
                id: category.id,
                name: category.name,
                slug: category.slug,
                image: category.image || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
                itemCount: category.itemCount || 1,
              }}
            />
          ))}
        </div>
      </section>

      {/* All Products Showcase with Interactive Category Pills */}
      <section className="space-y-4 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#3B302B]">
              All Bakery & Party Products
            </h2>
            <p className="text-[11px] sm:text-sm text-[#7A6E65] mt-0.5 sm:mt-1">
              Handcrafted cakes, fresh pastries, sourdough breads, and party decorations
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {[
              { id: "all", label: "🌟 All Items" },
              { id: "cakes", label: "🎂 Cakes" },
              { id: "pastries", label: "🥐 Pastries" },
              { id: "decorations", label: "🎉 Decorations" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 ${
                  activeTab === tab.id
                    ? "bg-[#3B302B] text-white ring-2 ring-[#596B58]"
                    : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:bg-[#FFF8EC] hover:text-[#596B58]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="text-center pt-2">
          <Link to="/products">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC]">
              <span>Explore All {allProducts.length}+ Products</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Party Decoration Accessories Dedicated Section */}
      <section className="space-y-4 sm:space-y-8 rounded-3xl bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 border border-[#E5DEC9] p-4 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#596B58]/10 text-[#596B58] text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">
              <PartyPopper className="h-3.5 w-3.5" />
              <span>Party Ready Accessories</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#3B302B]">
              Celebration Party Decorations
            </h2>
            <p className="text-[11px] sm:text-sm text-[#7A6E65] mt-0.5 sm:mt-1">
              Metallic candles, custom cake toppers, pastel balloons, and confetti poppers
            </p>
          </div>
          <Link
            to="/decorations"
            className="text-xs sm:text-sm font-bold text-[#596B58] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Open Party Shop</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {(decorationProducts.length > 0 ? decorationProducts : allProducts.slice(4, 8)).slice(0, 4).map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      {/* Celebration Occasions */}
      <section className="space-y-4 sm:space-y-8">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#3B302B]">Baking for Occasions</h2>
            <p className="text-[11px] sm:text-sm text-[#7A6E65] mt-0.5 sm:mt-1">Custom tier designs tailored for your milestone events</p>
          </div>
          <Link to="/occasions" className="text-xs sm:text-sm font-bold text-[#596B58] hover:underline flex items-center gap-1 shrink-0">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {occasions.map((occasion) => (
            <OccasionCard
              key={occasion.id}
              occasion={{
                id: occasion.id,
                name: occasion.name,
                slug: occasion.slug,
                image: occasion.image || "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=600&q=80",
                tagline: occasion.tagline || "Artisanal celebration cakes.",
              }}
            />
          ))}
        </div>
      </section>

      {/* Combo Collection */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">Special Celebration Combos</h2>
            <p className="text-xs sm:text-sm text-[#7A6E65] mt-1">Curated party hampers offering unbeatable savings</p>
          </div>
          <Link to="/combos" className="text-xs sm:text-sm font-bold text-[#596B58] hover:underline flex items-center gap-1 shrink-0">
            <span>View Combos</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </section>

      {/* Custom Cake Studio Callout Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-[#3B302B] via-[#3D2B20] to-[#3B302B] text-[#FFF8EC] p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-[#596B58]/30">
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#596B58]/20 border border-[#596B58]/40 text-amber-300 text-xs font-bold">
            <Cake className="h-4 w-4" />
            <span>Interactive 3D Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Design Your Own Dream Celebration Cake
          </h2>
          <p className="text-xs sm:text-sm text-[#E5DEC9]/80">
            Choose tiers, gourmet flavors, cream frostings, custom messages, and photo uploads. Real-time pricing & fresh delivery.
          </p>
        </div>
        <Link to="/custom-cake" className="shrink-0">
          <Button size="lg" className="bg-[#596B58] hover:bg-[#495948] text-white font-extrabold shadow-lg">
            <span>Launch Custom Cake Studio</span>
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </section>

      {/* Why Choose The Online Bakery */}
      <section className="rounded-3xl bg-[#3B302B] text-[#FFF8EC] p-6 sm:p-10 md:p-16 space-y-8 sm:space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#596B58]">Why Choose The Online Bakery?</h2>
          <p className="text-xs sm:text-sm text-[#E5DEC9]/80">We take pride in baking with uncompromised quality and passion.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <Cake className="h-9 w-9 sm:h-10 sm:w-10 text-[#596B58] mx-auto" />
            <h3 className="text-base sm:text-lg font-bold">100% Fresh Daily</h3>
            <p className="text-xs text-[#E5DEC9]/70">Baked fresh every single morning using premium ingredients.</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <Award className="h-9 w-9 sm:h-10 sm:w-10 text-[#596B58] mx-auto" />
            <h3 className="text-base sm:text-lg font-bold">Artisanal Master Bakers</h3>
            <p className="text-xs text-[#E5DEC9]/70">Crafted by award-winning pastry chefs with years of experience.</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <Clock className="h-9 w-9 sm:h-10 sm:w-10 text-[#596B58] mx-auto" />
            <h3 className="text-base sm:text-lg font-bold">Fast Home Delivery</h3>
            <p className="text-xs text-[#E5DEC9]/70">Temperature controlled delivery ensures fresh & pristine cakes.</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <ShieldCheck className="h-9 w-9 sm:h-10 sm:w-10 text-[#596B58] mx-auto" />
            <h3 className="text-base sm:text-lg font-bold">100% Eggless Option</h3>
            <p className="text-xs text-[#E5DEC9]/70">Dedicated eggless baking station for your dietary choices.</p>
          </div>
        </div>
      </section>

      {/* Customer Moving Reviews Marquee Section */}
      <section className="space-y-6 sm:space-y-8 overflow-hidden">
        <style>{`
          @keyframes marqueeAutoMove {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-50%, 0, 0);
            }
          }
          .animate-marquee-auto-move {
            display: flex !important;
            width: max-content !important;
            animation: marqueeAutoMove 22s linear infinite !important;
            will-change: transform;
          }
          .animate-marquee-auto-move:hover {
            animation-play-state: paused !important;
          }
        `}</style>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <span className="text-lg font-extrabold text-[#3B302B]">{avgRating} / 5.0</span>
              <span className="text-xs font-semibold text-[#7A6E65]">({reviews.length}+ Verified Customer Reviews)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">What Our Customers Say</h2>
            <p className="text-xs sm:text-sm text-[#7A6E65]">Live moving testimonials from celebrations across our delivery villages.</p>
          </div>

          <Button
            onClick={() => setIsRatingModalOpen(true)}
            variant="outline"
            className="border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC] self-start sm:self-auto shrink-0 font-bold"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span>Write a Review</span>
          </Button>
        </div>

        {reviews.length > 0 ? (
          <div className="relative w-full overflow-hidden py-4 -my-4 mask-linear-gradient">
            <div className="animate-marquee-auto-move gap-6 flex items-center py-2">
              {[...reviews, ...reviews, ...reviews].map((review, idx) => (
                <div key={`${review.id}-${idx}`} className="w-[300px] sm:w-[360px] shrink-0">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-[#7A6E65] py-8">No customer reviews yet. Be the first to share your celebration experience!</p>
        )}
      </section>

      {/* Rating & Review Submission Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
      />

      {/* Floating Contact Us Action Button (WhatsApp, Call, Email) */}
      <ContactUsFloatingButton />
    </div>
  );
};
