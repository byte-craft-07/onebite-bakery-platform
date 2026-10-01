import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Cake, Clock, Gift, PartyPopper, ShieldCheck, Sparkles, Star, Tag, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CategoryCard, ComboCard, OccasionCard, ReviewCard } from "@/components/cards/DomainCards";
import { ProductCard } from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/Button";
import { RatingModal } from "@/components/review/RatingModal";
import { type MockReview } from "@/data/mockData";
import { catalogService, type CategoryItem, type OccasionItem, type ProductItem } from "@/services/catalog.service";
import { comboService, type Combo } from "@/services/combo.service";
import { useAuth } from "@/contexts/auth.context";
import { reviewService } from "@/services/review.service";
import { MobileHeroQuickBar } from "@/components/navigation/MobileHeroQuickBar";
import { ContactUsFloatingButton } from "@/components/common/ContactUsFloatingButton";
import { HeroBannerSlider } from "@/components/home/HeroBannerSlider";
import { clientCache } from "@/utils/clientCache";

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { currentLocation } = useAuth();

  // Instant render from cache if available (0ms loading)
  const cachedCategories = clientCache.get<CategoryItem[]>("catalog_categories");
  const cachedOccasions = clientCache.get<OccasionItem[]>("catalog_occasions");
  const cachedCombos = clientCache.get<Combo[]>("combos_list");

  const [categories, setCategories] = useState<CategoryItem[]>(() => cachedCategories || []);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [occasions, setOccasions] = useState<OccasionItem[]>(() => cachedOccasions || []);
  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [combos, setCombos] = useState<Combo[]>(() => cachedCombos || []);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedCategories || cachedCategories.length === 0);

  const fetchHomeData = async (forceRefresh: boolean = false) => {
    // Only show full loading spinner if we don't have any cached categories
    if (!cachedCategories || cachedCategories.length === 0 || forceRefresh) {
      setIsLoading(true);
    }
    try {
      const [catList, prodRes, occList, revList, comboList] = await Promise.all([
        catalogService.getCategories(forceRefresh),
        catalogService.searchProducts({ limit: 20 }, forceRefresh),
        catalogService.getOccasions(forceRefresh),
        reviewService.getReviews(),
        comboService.getCombos(forceRefresh).catch(() => []),
      ]);
      setCategories(catList || []);
      setAllProducts(prodRes?.products || []);
      setOccasions(occList || []);
      setReviews(revList || []);
      setCombos(comboList || []);
    } catch (_err) {
      if (!cachedCategories || cachedCategories.length === 0) {
        setCategories([]);
        setAllProducts([]);
        setOccasions([]);
        setReviews([]);
        setCombos([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
    const handleLocationChange = () => {
      fetchHomeData(true);
    };
    const handleReviewSubmitted = () => {
      fetchHomeData(true);
    };
    window.addEventListener("onebitebakery_review_submitted", handleReviewSubmitted);
    window.addEventListener("onebitebakery_location_changed", handleLocationChange);
    return () => {
      window.removeEventListener("onebitebakery_review_submitted", handleReviewSubmitted);
      window.removeEventListener("onebitebakery_location_changed", handleLocationChange);
    };
  }, [currentLocation]);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
      : null;

  // Filtered Products dynamically based on database categories
  const filteredProducts = allProducts.filter((p) => {
    if (activeTab === "all") return true;
    const catId = p.categoryId?.id || (p.categoryId as any)?._id;
    if (catId && catId === activeTab) return true;
    if (p.categoryId?.slug && p.categoryId.slug === activeTab) return true;
    const selectedCat = categories.find((c) => c.id === activeTab || c.slug === activeTab);
    if (selectedCat) {
      if (p.categoryId?.name && p.categoryId.name.toLowerCase() === selectedCat.name.toLowerCase()) return true;
      if (p.name.toLowerCase().includes(selectedCat.name.toLowerCase())) return true;
    }
    return false;
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
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#3B302B]">{t("home.browseCategories", "Browse Categories")}</h2>
            <p className="text-[11px] sm:text-sm text-[#7A6E65] mt-0.5 sm:mt-1">{t("home.browseCategoriesSubtitle", "Explore our complete range of baked goods & party items")}</p>
          </div>
          <Link to="/categories" className="text-xs sm:text-sm font-bold text-[#596B58] hover:underline flex items-center gap-1 shrink-0">
            <span>{t("common.viewAll", "View All")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={{
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  image: category.image || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
                  itemCount: category.itemCount !== undefined ? category.itemCount : 0,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-6 text-center text-xs sm:text-sm text-[#7A6E65]">
            {t("home.noCategories", "No categories available.")}
          </div>
        )}
      </section>

      {/* All Products Showcase with Interactive Category Pills */}
      <section className="space-y-4 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#3B302B]">
              {t("home.allProductsTitle", "All Bakery & Party Products")}
            </h2>
            <p className="text-[11px] sm:text-sm text-[#7A6E65] mt-0.5 sm:mt-1">
              {t("home.allProductsSubtitle", "Handcrafted cakes, fresh pastries, sourdough breads, and party decorations")}
            </p>
          </div>

          {/* Filter Pills dynamically generated from database categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {[
              { id: "all", label: t("home.tabAll", "🌟 All Items") },
              ...categories.map((c) => ({
                id: c.id,
                label: c.name,
              })),
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

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-8 text-center text-xs sm:text-sm text-[#7A6E65]">
            {t("home.noProducts", "No products available in this section.")}
          </div>
        )}

        {allProducts.length > 0 && (
          <div className="text-center pt-2">
            <Link to="/products">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC]">
                <span>{t("home.exploreAllProducts", { count: allProducts.length, defaultValue: `Explore All ${allProducts.length}+ Products` })}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Party Decoration Accessories Dedicated Section */}
      {decorationProducts.length > 0 && (
        <section className="space-y-4 sm:space-y-8 rounded-3xl bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 border border-[#E5DEC9] p-4 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#596B58]/10 text-[#596B58] text-xs font-bold uppercase tracking-wider mb-1 sm:mb-2">
                <PartyPopper className="h-3.5 w-3.5" />
                <span>{t("home.partyReadyAccessories", "Party Ready Accessories")}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-[#3B302B]">
                {t("home.partyDecorationsTitle", "Celebration Party Decorations")}
              </h2>
              <p className="text-[11px] sm:text-sm text-[#7A6E65] mt-0.5 sm:mt-1">
                {t("home.partyDecorationsSubtitle", "Metallic candles, custom cake toppers, pastel balloons, and confetti poppers")}
              </p>
            </div>
            <Link
              to="/decorations"
              className="text-xs sm:text-sm font-bold text-[#596B58] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>{t("home.openPartyShop", "Open Party Shop")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {decorationProducts.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Celebration Occasions */}
      {occasions.length > 0 && (
        <section className="space-y-4 sm:space-y-8">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-[#3B302B]">{t("home.occasionsTitle", "Baking for Occasions")}</h2>
              <p className="text-[11px] sm:text-sm text-[#7A6E65] mt-0.5 sm:mt-1">{t("home.occasionsSubtitle", "Custom tier designs tailored for your milestone events")}</p>
            </div>
            <Link to="/occasions" className="text-xs sm:text-sm font-bold text-[#596B58] hover:underline flex items-center gap-1 shrink-0">
              <span>{t("common.viewAll", "View All")}</span>
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
      )}

      {/* Combo Collection */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">{t("home.combosTitle", "Special Celebration Combos")}</h2>
            <p className="text-xs sm:text-sm text-[#7A6E65] mt-1">{t("home.combosSubtitle", "Curated party hampers offering unbeatable savings")}</p>
          </div>
          <Link to="/combos" className="text-xs sm:text-sm font-bold text-[#596B58] hover:underline flex items-center gap-1 shrink-0">
            <span>{t("home.viewCombos", "View Combos")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {combos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-8 text-center text-xs sm:text-sm text-[#7A6E65]">
            {t("home.noCombos", "No combos available at this time.")}
          </div>
        )}
      </section>

      {/* Custom Cake Studio Callout Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-[#3B302B] via-[#3D2B20] to-[#3B302B] text-[#FFF8EC] p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-[#596B58]/30">
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#596B58]/20 border border-[#596B58]/40 text-amber-300 text-xs font-bold">
            <Cake className="h-4 w-4" />
            <span>{t("home.customCakeStudioBadge", "Interactive 3D Studio")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t("home.customCakeStudioTitle", "Design Your Own Dream Celebration Cake")}
          </h2>
          <p className="text-xs sm:text-sm text-[#E5DEC9]/80">
            {t("home.customCakeStudioDesc", "Choose tiers, gourmet flavors, cream frostings, custom messages, and photo uploads. Real-time pricing & fresh delivery.")}
          </p>
        </div>
        <Link to="/custom-cake" className="shrink-0">
          <Button size="lg" className="bg-[#596B58] hover:bg-[#495948] text-white font-extrabold shadow-lg">
            <span>{t("home.launchCustomCakeStudio", "Launch Custom Cake Studio")}</span>
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </section>

      {/* Why Choose Onebite Bakery */}
      <section className="rounded-3xl bg-[#3B302B] text-[#FFF8EC] p-6 sm:p-10 md:p-16 space-y-8 sm:space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#596B58]">{t("home.whyChooseTitle", "Why Choose Onebite Bakery?")}</h2>
          <p className="text-xs sm:text-sm text-[#E5DEC9]/80">{t("home.whyChooseSubtitle", "We take pride in baking with uncompromised quality and passion.")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <Cake className="h-9 w-9 sm:h-10 sm:w-10 text-[#596B58] mx-auto" />
            <h3 className="text-base sm:text-lg font-bold">{t("home.freshDailyTitle", "100% Fresh Daily")}</h3>
            <p className="text-xs text-[#E5DEC9]/70">{t("home.freshDailyDesc", "Baked fresh every single morning using premium ingredients.")}</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <Award className="h-9 w-9 sm:h-10 sm:w-10 text-[#596B58] mx-auto" />
            <h3 className="text-base sm:text-lg font-bold">{t("home.artisanalBakersTitle", "Artisanal Master Bakers")}</h3>
            <p className="text-xs text-[#E5DEC9]/70">{t("home.artisanalBakersDesc", "Crafted by award-winning pastry chefs with years of experience.")}</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <Clock className="h-9 w-9 sm:h-10 sm:w-10 text-[#596B58] mx-auto" />
            <h3 className="text-base sm:text-lg font-bold">{t("home.fastDeliveryTitle", "Fast Home Delivery")}</h3>
            <p className="text-xs text-[#E5DEC9]/70">{t("home.fastDeliveryDesc", "Temperature controlled delivery ensures fresh & pristine cakes.")}</p>
          </div>
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4">
            <ShieldCheck className="h-9 w-9 sm:h-10 sm:w-10 text-[#596B58] mx-auto" />
            <h3 className="text-base sm:text-lg font-bold">{t("home.egglessOptionTitle", "100% Eggless Option")}</h3>
            <p className="text-xs text-[#E5DEC9]/70">{t("home.egglessOptionDesc", "Dedicated eggless baking station for your dietary choices.")}</p>
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
            {avgRating ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <span className="text-lg font-extrabold text-[#3B302B]">{avgRating} / 5.0</span>
                <span className="text-xs font-semibold text-[#7A6E65]">
                  {t("home.verifiedReviewsCount", { count: reviews.length, defaultValue: `(${reviews.length} Verified Customer Reviews)` })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  {t("home.customerReviewsBadge", "Customer Reviews")}
                </span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">{t("home.reviewsTitle", "What Our Customers Say")}</h2>
            <p className="text-xs sm:text-sm text-[#7A6E65]">{t("home.reviewsSubtitle", "Live testimonials from celebrations across our delivery villages.")}</p>
          </div>

          <Button
            onClick={() => setIsRatingModalOpen(true)}
            variant="outline"
            className="border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC] self-start sm:self-auto shrink-0 font-bold"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span>{t("home.writeReview", "Write a Review")}</span>
          </Button>
        </div>

        {reviews.length > 0 ? (
          <div className="relative w-full overflow-hidden py-4 -my-4 mask-linear-gradient">
            <div className="animate-marquee-auto-move gap-6 flex items-center py-2">
              {[...reviews, ...(reviews.length < 5 ? reviews : []), ...(reviews.length < 3 ? reviews : [])].map((review, idx) => (
                <div key={`${review.id}-${idx}`} className="w-[300px] sm:w-[360px] shrink-0">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-10 px-6 rounded-3xl bg-[#FFF8EC]/60 border border-dashed border-[#E5DEC9] text-center space-y-3 my-2">
            <div className="h-12 w-12 rounded-full bg-[#596B58]/10 text-[#596B58] flex items-center justify-center mx-auto border border-[#596B58]/20">
              <Sparkles className="h-6 w-6 text-[#596B58]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-[#3B302B]">{t("home.noReviewsTitle", "It has no reviews yet")}</h3>
              <p className="text-xs text-[#7A6E65] max-w-md mx-auto">
                {t("home.noReviewsDesc", "No customer reviews have been posted yet. Be the first to share your celebration experience!")}
              </p>
            </div>
            <Button
              onClick={() => setIsRatingModalOpen(true)}
              className="font-bold text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              <span>{t("home.writeFirstReview", "Write the First Review")}</span>
            </Button>
          </div>
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
