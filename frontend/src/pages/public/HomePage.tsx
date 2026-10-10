import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Cake, ChevronDown, Clock, Gift, HelpCircle, PartyPopper, ShieldCheck, Sparkles, Star, Tag, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SEOHead, buildLocalBusinessSchema, buildFAQSchema } from "@/components/seo";

import { CategoryCard, ComboCard, OccasionCard, ReviewCard } from "@/components/cards/DomainCards";
import { ProductCard } from "@/components/cards/ProductCard";
import { ViewMoreCard } from "@/components/cards/ViewMoreCard";
import {
  CategoryCardSkeleton,
  CategoryPillSkeleton,
  ComboCardSkeleton,
  OccasionCardSkeleton,
  ProductCardSkeleton,
  ReviewCardSkeleton,
} from "@/components/cards/SkeletonCards";
import { Button } from "@/components/ui/Button";
import { RatingModal } from "@/components/review/RatingModal";
import { type MockReview } from "@/data/mockData";
import { catalogService, type CategoryItem, type OccasionItem, type ProductItem } from "@/services/catalog.service";
import { comboService, type Combo } from "@/services/combo.service";
import { decorationService } from "@/services/decoration.service";
import { useAuth } from "@/contexts/auth.context";
import { reviewService } from "@/services/review.service";
import { MobileHeroQuickBar } from "@/components/navigation/MobileHeroQuickBar";
import { ContactUsFloatingButton } from "@/components/common/ContactUsFloatingButton";
import { HeroBannerSlider } from "@/components/home/HeroBannerSlider";
import { clientCache } from "@/utils/clientCache";
import {
  organizeProductsRowWise,
  convertDecorationToProductItem,
} from "@/utils/productGridUtils";

const HOME_FAQS = [
  {
    question: "Do you offer eggless cakes?",
    answer: "Yes, 100% of our cakes, pastries, and breads can be prepared eggless. We utilize dedicated eggless baking stations and separate equipment to guarantee absolute dietary integrity.",
  },
  {
    question: "Can I order a custom cake for birthdays or weddings?",
    answer: "Absolutely! You can design multi-tier celebration cakes through our interactive Custom Cake Studio, choose your preferred sponge flavor, cream filling, and message, or upload your own custom photo design.",
  },
  {
    question: "Do you provide local doorstep delivery in Hamirpur?",
    answer: "Yes, OneBite Bakery offers doorstep delivery across Hamirpur, Terha, Kurara, Sumerpur, and neighboring villages. Free in-store pickup is also available at our Terha bakery location.",
  },
  {
    question: "How early should I place an order for custom cakes?",
    answer: "We recommend placing custom designer cake orders 24 to 48 hours in advance so our artisan pastry chefs have ample time for handcrafting. Standard celebration cakes are available for same-day delivery.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Debit and Credit Cards, Net Banking via Razorpay, as well as Cash on Delivery / Pay on Pickup.",
  },
];

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { currentLocation } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Instant render from cache if available (0ms loading)
  const cachedCategories = clientCache.get<CategoryItem[]>("catalog_categories");
  const cachedOccasions = clientCache.get<OccasionItem[]>("catalog_occasions");
  const cachedCombos = clientCache.get<Combo[]>("combos_list");
  const cachedDecorations = clientCache.get<ProductItem[]>("decorations_list");

  const [categories, setCategories] = useState<CategoryItem[]>(() => cachedCategories || []);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [decorations, setDecorations] = useState<ProductItem[]>(() => cachedDecorations || []);
  const [occasions, setOccasions] = useState<OccasionItem[]>(() => cachedOccasions || []);
  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [combos, setCombos] = useState<Combo[]>(() => cachedCombos || []);
  const [activeTab, setActiveTab] = useState<string>("all");

  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(() => !cachedCategories || cachedCategories.length === 0);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isLoadingOccasions, setIsLoadingOccasions] = useState<boolean>(() => !cachedOccasions || cachedOccasions.length === 0);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [isLoadingCombos, setIsLoadingCombos] = useState<boolean>(() => !cachedCombos || cachedCombos.length === 0);

  const fetchHomeData = async (forceRefresh: boolean = false) => {
    if (forceRefresh || categories.length === 0) setIsLoadingCategories(true);
    if (forceRefresh || allProducts.length === 0) setIsLoadingProducts(true);
    if (forceRefresh || occasions.length === 0) setIsLoadingOccasions(true);
    if (forceRefresh || reviews.length === 0) setIsLoadingReviews(true);
    if (forceRefresh || combos.length === 0) setIsLoadingCombos(true);

    try {
      const [catList, prodRes, occList, revList, comboList, decorList] = await Promise.all([
        catalogService.getCategories(forceRefresh),
        catalogService.searchProducts({ limit: 40 }, forceRefresh),
        catalogService.getOccasions(forceRefresh),
        reviewService.getReviews(),
        comboService.getCombos(forceRefresh).catch(() => []),
        decorationService.getDecorations().catch(() => []),
      ]);
      const mappedDecors = (decorList || []).map((d) =>
        convertDecorationToProductItem(d, catList || []),
      );
      setDecorations(mappedDecors);

      // Dynamically ensure category itemCount includes matching decorations
      const updatedCats = (catList || []).map((cat) => {
        const catNameLower = (cat.name || "").toLowerCase().trim();
        const catSlugLower = (cat.slug || "").toLowerCase().trim();
        const matchingDecoCount = mappedDecors.filter((d) => {
          const dCatId = d.categoryId?.id;
          const dNameLower = (d.categoryId?.name || "").toLowerCase().trim();
          const dSlugLower = (d.categoryId?.slug || "").toLowerCase().trim();
          return (
            dCatId === cat.id ||
            dSlugLower === catSlugLower ||
            dNameLower === catNameLower
          );
        }).length;

        const currentCount = cat.itemCount ?? 0;
        return {
          ...cat,
          itemCount: Math.max(currentCount, matchingDecoCount),
        };
      });
      setCategories(updatedCats);
      setAllProducts(prodRes?.products || []);
      setOccasions(occList || []);
      setReviews(revList || []);
      setCombos(comboList || []);
      if (mappedDecors.length > 0) {
        clientCache.set("decorations_list", mappedDecors);
      } else {
        clientCache.invalidate("decorations_list");
      }
    } catch (_err) {
      if (!cachedCategories || cachedCategories.length === 0) {
        setCategories([]);
        setAllProducts([]);
        setDecorations([]);
        setOccasions([]);
        setReviews([]);
        setCombos([]);
      }
    } finally {
      setIsLoadingCategories(false);
      setIsLoadingProducts(false);
      setIsLoadingOccasions(false);
      setIsLoadingReviews(false);
      setIsLoadingCombos(false);
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
    const handleCatalogUpdated = () => {
      fetchHomeData(true);
    };
    window.addEventListener("onebitebakery_review_submitted", handleReviewSubmitted);
    window.addEventListener("onebitebakery_location_changed", handleLocationChange);
    window.addEventListener("onebitebakery_catalog_updated", handleCatalogUpdated);
    return () => {
      window.removeEventListener("onebitebakery_review_submitted", handleReviewSubmitted);
      window.removeEventListener("onebitebakery_location_changed", handleLocationChange);
      window.removeEventListener("onebitebakery_catalog_updated", handleCatalogUpdated);
    };
  }, [currentLocation]);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
      : null;

  // Row-wise organized products layout (Row 1&2: Bakery, Row 3: Decoration, Row 4+: Mixed)
  const rowWiseLayout = React.useMemo(() => {
    return organizeProductsRowWise(allProducts, {
      bakerySlots: 8,
      decorationSlots: 4,
      additionalDecorations: decorations,
    });
  }, [allProducts, decorations]);

  // Combined product catalog ensuring decorations are available when filtering by category
  const combinedCatalog = React.useMemo(() => {
    const list = [...allProducts];
    const seen = new Set(list.map((p) => p.id));
    for (const d of decorations) {
      if (!seen.has(d.id)) {
        list.push(d);
        seen.add(d.id);
      }
    }
    return list;
  }, [allProducts, decorations]);

  // Filtered Products dynamically based on database categories
  const filteredProducts = activeTab === "all"
    ? rowWiseLayout.orderedProducts
    : combinedCatalog.filter((p) => {
        const catId = p.categoryId?.id || (p.categoryId as any)?._id;
        if (catId && catId === activeTab) return true;
        if (p.categoryId?.slug && p.categoryId.slug === activeTab) return true;
        const selectedCat = categories.find((c) => c.id === activeTab || c.slug === activeTab);
        if (selectedCat) {
          const selectedNameLower = selectedCat.name.toLowerCase().trim();
          const selectedSlugLower = selectedCat.slug.toLowerCase().trim();
          const pCatName = (p.categoryId?.name || "").toLowerCase().trim();
          const pCatSlug = (p.categoryId?.slug || "").toLowerCase().trim();
          if (pCatName && (pCatName === selectedNameLower || pCatName.includes(selectedNameLower) || selectedNameLower.includes(pCatName))) return true;
          if (pCatSlug && (pCatSlug === selectedSlugLower || pCatSlug === activeTab)) return true;
          if (p.name.toLowerCase().includes(selectedNameLower)) return true;
          if (
            (selectedNameLower.includes("decor") || selectedSlugLower.includes("decor")) &&
            (p.productType === "DECORATION" || (p as any).category?.toLowerCase?.().includes("decor"))
          ) {
            return true;
          }
        }
        return false;
      });

  const decorationProducts = rowWiseLayout.allDecorationProducts.length > 0
    ? rowWiseLayout.allDecorationProducts
    : decorations;

  return (
    <div className="space-y-8 sm:space-y-14 md:space-y-16 pb-16">
      <SEOHead
        title="OneBite Bakery | Cakes, Pastries & Custom Cakes"
        description="Order fresh handcrafted cakes, birthday cakes, custom cakes, pastries, combos, and party decoration items online from OneBite Bakery. Fast local delivery in Hamirpur, UP."
        canonicalPath="/"
        structuredData={[buildLocalBusinessSchema(), buildFAQSchema(HOME_FAQS)]}
      />

      {/* Mobile Top Category & Location Bar (Matching Reference Layout) */}
      <div className="block lg:hidden">
        <MobileHeroQuickBar />
      </div>

      {/* Auto-Changing Responsive Hero Banner Posters */}
      <HeroBannerSlider autoPlayInterval={4500} />

      {/* Main Brand Heading Section */}
      <section className="text-center max-w-3xl mx-auto px-4 pt-1 sm:pt-2 space-y-1.5 sm:space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold bg-[#596B58]/10 text-[#596B58] border border-[#596B58]/20 uppercase tracking-widest">
          <Sparkles className="h-3 w-3" />
          <span>Fresh Baked Daily • 100% Eggless Available</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#3B302B] tracking-tight">
          OneBite Bakery — Fresh Cakes, Pastries &amp; Custom Cakes
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6E65] leading-relaxed">
          Handcrafted celebration cakes, artisanal pastries, fresh sourdough breads, and party supplies baked with pure butter and Belgian dark chocolate. Local doorstep delivery in Hamirpur.
        </p>
      </section>

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

        {isLoadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        ) : categories.length > 0 ? (
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
                  isComingSoon: category.isComingSoon,
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
          {isLoadingCategories && categories.length === 0 ? (
            <CategoryPillSkeleton count={5} />
          ) : (
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
          )}
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          activeTab === "all" ? (
            <div className="space-y-8 sm:space-y-10">
              {/* Row 1 & 2: Bakery Products (Cakes, Pastries, Breads, Cookies) */}
              {rowWiseLayout.bakeryRowProducts.length > 0 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFF8EC] text-[#3B302B] border border-[#E5DEC9] shadow-2xs">
                        <Cake className="h-3.5 w-3.5 text-[#596B58]" />
                        <span>🍰 {t("home.rowBakeryTitle", "Bakery Specials (Cakes & Pastries)")}</span>
                      </span>
                      <span className="hidden sm:inline text-xs text-[#7A6E65] font-medium">
                        {t("home.rowBakerySubtitle", "Rows 1 & 2 • Handcrafted fresh bakes")}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {(rowWiseLayout.hasMoreBakery ? rowWiseLayout.bakeryDisplayProducts : rowWiseLayout.bakeryRowProducts).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                    {rowWiseLayout.hasMoreBakery && (
                      <ViewMoreCard
                        title="Explore All Cakes & Pastries"
                        subtitle={`${rowWiseLayout.totalBakeryCount}+ artisanal cakes, pastries & fresh bakes`}
                        link="/categories/cakes"
                        count={rowWiseLayout.totalBakeryCount}
                        badgeText="🍰 अभी और भी बेकरी प्रोडक्ट्स हैं"
                        buttonText={`Explore All ${rowWiseLayout.totalBakeryCount}+ Cakes`}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Row 3: Decoration Items (Party Candles, Balloons, Toppers, Poppers) */}
              {rowWiseLayout.decorationRowProducts.length > 0 && (
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
                        <PartyPopper className="h-3.5 w-3.5 text-amber-600" />
                        <span>🎉 {t("home.rowDecorationTitle", "Party & Celebration Decorations")}</span>
                      </span>
                      <span className="hidden sm:inline text-xs text-[#7A6E65] font-medium">
                        {t("home.rowDecorationSubtitle", "Row 3 • Candles, balloons & toppers")}
                      </span>
                    </div>
                    <Link to="/decorations" className="text-xs font-bold text-[#596B58] hover:underline flex items-center gap-1">
                      <span>{t("home.openPartyShop", "Open Party Shop")}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {(rowWiseLayout.hasMoreDecorations ? rowWiseLayout.decorationDisplayProducts : rowWiseLayout.decorationRowProducts).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                    {rowWiseLayout.hasMoreDecorations && (
                      <ViewMoreCard
                        title="Explore Party Decorations"
                        subtitle="Metallic candles, balloon arches, toppers & poppers"
                        link="/decorations"
                        count={rowWiseLayout.totalDecorationCount}
                        badgeText="🎉 अभी और भी डेकोरेशन सामान है"
                        buttonText={`Explore All ${rowWiseLayout.totalDecorationCount}+ Decors`}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Row 4+: Mixed Remaining Products (All products mixed once typed rows finish) */}
              {rowWiseLayout.mixedDisplayProducts.length > 0 && (
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#596B58]/10 text-[#596B58] border border-[#596B58]/20 shadow-2xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>✨ {t("home.rowMixedTitle", "All Delights (Mixed Collection)")}</span>
                    </span>
                    <span className="hidden sm:inline text-xs text-[#7A6E65] font-medium">
                      {t("home.rowMixedSubtitle", "Row 4+ • Complete celebration collection")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {(rowWiseLayout.hasMoreMixed ? rowWiseLayout.mixedDisplayProducts : rowWiseLayout.mixedRemainingProducts).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                    {rowWiseLayout.hasMoreMixed && (
                      <ViewMoreCard
                        title="Explore All Products"
                        subtitle="Browse handcrafted cakes, savory bakes & party items"
                        link="/products"
                        count={rowWiseLayout.totalProductsCount}
                        badgeText="✨ अभी और भी प्रोडक्ट्स हैं"
                        buttonText={`Explore All ${rowWiseLayout.totalProductsCount}+ Products`}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5DEC9] p-8 text-center text-xs sm:text-sm text-[#7A6E65]">
            {t("home.noProducts", "No products available in this section.")}
          </div>
        )}

        {isLoadingProducts ? (
          <div className="flex justify-center pt-2">
            <div className="h-11 w-48 rounded-xl bg-[#E5DEC9]/50 animate-pulse" />
          </div>
        ) : allProducts.length > 0 ? (
          <div className="text-center pt-2">
            <Link to="/products">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC]">
                <span>{t("home.exploreAllProducts", { count: allProducts.length, defaultValue: `Explore All ${allProducts.length}+ Products` })}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : null}
      </section>

      {/* Party Decoration Accessories Dedicated Section */}
      {(isLoadingProducts || decorationProducts.length > 0) && (
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

          {isLoadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {decorationProducts.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Celebration Occasions */}
      {(isLoadingOccasions || occasions.length > 0) && (
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

          {isLoadingOccasions ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <OccasionCardSkeleton key={i} />
              ))}
            </div>
          ) : (
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
          )}
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

        {isLoadingCombos ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <ComboCardSkeleton />
            <ComboCardSkeleton />
          </div>
        ) : combos.length > 0 ? (
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
            {isLoadingReviews ? (
              <div className="h-6 w-36 rounded-full bg-[#E5DEC9]/60 animate-pulse" />
            ) : avgRating ? (
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

        {isLoadingReviews ? (
          <div className="relative w-full overflow-hidden py-4 -my-4">
            <div className="gap-6 flex items-center py-2 overflow-x-hidden">
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
            </div>
          </div>
        ) : reviews.length > 0 ? (
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

      {/* Frequently Asked Questions (FAQ) Section */}
      <section className="space-y-6 max-w-4xl mx-auto px-2 sm:px-0">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-[#596B58] uppercase tracking-wider">Help &amp; Answers</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-[#7A6E65]">Everything you need to know about our bakery orders, custom cakes, and delivery.</p>
        </div>

        <div className="space-y-3">
          {HOME_FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-[#E5DEC9] bg-white overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-[#3B302B] hover:text-[#596B58] transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#7A6E65] shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-[#7A6E65] leading-relaxed border-t border-[#E5DEC9]/40 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
