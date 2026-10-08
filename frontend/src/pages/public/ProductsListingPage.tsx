import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Cake, PartyPopper, Search, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/cards/ProductCard";
import { ViewMoreCard } from "@/components/cards/ViewMoreCard";
import { ProductCardSkeleton } from "@/components/cards/SkeletonCards";
import { EmptyState } from "@/components/ui/DisplayComponents";
import {
  catalogService,
  type CategoryItem,
  type ProductItem,
  type SearchProductsQueryParams,
} from "@/services/catalog.service";
import { decorationService } from "@/services/decoration.service";
import {
  organizeProductsRowWise,
  convertDecorationToProductItem,
} from "@/utils/productGridUtils";

import { useAuth } from "@/contexts/auth.context";
import { useTranslation } from "react-i18next";
import { getLocalizedCategoryName } from "@/i18n/utils";
import { SEOHead, buildCollectionSchema } from "@/components/seo";

export const ProductsListingPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentLocation } = useAuth();
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();

  const isCategoryPath = location.pathname.startsWith("/categories");
  const isOccasionPath = location.pathname.startsWith("/occasions");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(isCategoryPath ? slug : undefined);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [decorations, setDecorations] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [instantOnly, setInstantOnly] = useState(false);

  useEffect(() => {
    catalogService
      .getCategories()
      .then((cats) => {
        setCategories(cats);
        decorationService
          .getDecorations()
          .then((decs) => setDecorations((decs || []).map((d) => convertDecorationToProductItem(d, cats))))
          .catch(() => setDecorations([]));
      })
      .catch(() => {
        setCategories([]);
        decorationService
          .getDecorations()
          .then((decs) => setDecorations((decs || []).map((d) => convertDecorationToProductItem(d))))
          .catch(() => setDecorations([]));
      });
  }, []);

  useEffect(() => {
    if (slug && isCategoryPath) {
      setSelectedCategory(slug);
    }
  }, [slug, isCategoryPath]);

  const isDefaultAllView =
    !selectedCategory &&
    !searchQuery.trim() &&
    !isOccasionPath &&
    !instantOnly &&
    currentPage === 1;

  const rowWiseLayout = React.useMemo(() => {
    if (!isDefaultAllView) return null;
    return organizeProductsRowWise(products, {
      bakerySlots: 8,
      decorationSlots: 4,
      additionalDecorations: decorations,
    });
  }, [isDefaultAllView, products, decorations]);

  const displayedProducts = React.useMemo(() => {
    if (isDefaultAllView && rowWiseLayout) {
      return null;
    }
    const list = [...products];
    const seen = new Set(list.map((p) => p.id));

    if (selectedCategory) {
      const selectedCat = categories.find(
        (c) => c.slug === selectedCategory || c.id === selectedCategory,
      );
      const isDecorCat =
        selectedCategory.toLowerCase().includes("decor") ||
        (selectedCat &&
          (selectedCat.name.toLowerCase().includes("decor") ||
            selectedCat.slug.toLowerCase().includes("decor")));

      for (const d of decorations) {
        if (!seen.has(d.id)) {
          const dCatId = d.categoryId?.id;
          const dCatSlug = d.categoryId?.slug;
          const dCatName = (d.categoryId?.name || "").toLowerCase().trim();

          const matches =
            dCatId === selectedCategory ||
            dCatSlug === selectedCategory ||
            (selectedCat &&
              (dCatName === selectedCat.name.toLowerCase().trim() ||
                dCatSlug === selectedCat.slug.toLowerCase().trim())) ||
            (isDecorCat && d.productType === "DECORATION");

          if (matches) {
            list.push(d);
            seen.add(d.id);
          }
        }
      }
    } else if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      for (const d of decorations) {
        if (!seen.has(d.id)) {
          if (
            d.name.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q) ||
            (d.categoryId?.name && d.categoryId.name.toLowerCase().includes(q))
          ) {
            list.push(d);
            seen.add(d.id);
          }
        }
      }
    }
    return list;
  }, [isDefaultAllView, rowWiseLayout, products, decorations, selectedCategory, categories, searchQuery]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params: SearchProductsQueryParams = {
        page: currentPage,
        limit: isDefaultAllView ? 24 : 16,
        q: searchQuery.trim() || undefined,
        category: selectedCategory,
        occasion: isOccasionPath ? slug : undefined,
        isInstantAvailable: instantOnly ? true : undefined,
      };
      const res = await catalogService.searchProducts(params);
      setProducts(res.products);
      setPagination(res.pagination);
    } catch (_err) {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleLocationChange = () => {
      fetchProducts();
    };

    window.addEventListener("onebitebakery_location_changed", handleLocationChange);
    return () => {
      window.removeEventListener("onebitebakery_location_changed", handleLocationChange);
    };
  }, [searchQuery, selectedCategory, currentPage, currentLocation, slug, instantOnly]);

  const currentCategory = categories.find((c) => c.slug === slug || c.id === slug);
  const currentCategoryName = currentCategory ? getLocalizedCategoryName(currentCategory) : slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
  const currentOccasionName = isOccasionPath && slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  let pageTitle = "Artisanal Cakes, Pastries & Breads Catalog";
  let pageDescription = "Explore our complete selection of freshly baked handcrafted cakes, velvety pastries, sourdough breads, cookies, and party decoration hampers at OneBite Bakery.";
  let canonicalPath = "/products";
  let breadcrumbsList = [{ name: "Products", url: "/products" }];

  if (isCategoryPath && slug) {
    pageTitle = `${currentCategoryName} | Fresh Bakery Delights`;
    pageDescription = currentCategory?.description || `Explore our freshly baked ${currentCategoryName.toLowerCase()} collection at OneBite Bakery. Prepared daily with pure ingredients. Local delivery in Hamirpur.`;
    canonicalPath = `/categories/${slug}`;
    breadcrumbsList = [
      { name: "Categories", url: "/categories" },
      { name: currentCategoryName, url: `/categories/${slug}` },
    ];
  } else if (isOccasionPath && slug) {
    pageTitle = `${currentOccasionName} Celebration Cakes`;
    pageDescription = `Celebrate your special ${currentOccasionName.toLowerCase()} with custom designer cakes, luxury hampers, and gourmet party treats from OneBite Bakery.`;
    canonicalPath = `/occasions/${slug}`;
    breadcrumbsList = [
      { name: "Occasions", url: "/occasions" },
      { name: currentOccasionName, url: `/occasions/${slug}` },
    ];
  }

  const titleText = isCategoryPath && slug
    ? t("products.categoryPrefix", { name: currentCategoryName, defaultValue: currentCategoryName })
    : isOccasionPath && slug
    ? t("products.occasionPrefix", { name: currentOccasionName, defaultValue: `${currentOccasionName} Cakes` })
    : t("products.catalogTitle", "Our Bakery Catalog");

  const collectionSchema = buildCollectionSchema(
    pageTitle,
    pageDescription,
    products.map((p) => ({
      name: p.name,
      url: `/products/${p.slug || p.id}`,
      image: p.mainImage,
      price: p.price,
    }))
  );

  return (
    <div className="space-y-6 pb-16">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath={canonicalPath}
        breadcrumbs={breadcrumbsList}
        structuredData={collectionSchema}
      />

      {/* Top Back Link & Semantic Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Link
          to={isCategoryPath ? "/categories" : isOccasionPath ? "/occasions" : "/"}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>
            {isCategoryPath
              ? t("products.backToCategories", "Back to Categories")
              : isOccasionPath
              ? t("products.backToOccasions", "Back to Occasions")
              : t("products.backToHome", "Back to Home")}
          </span>
        </Link>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-[#596B58] transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          {isCategoryPath ? (
            <>
              <Link to="/categories" className="hover:text-[#596B58] transition-colors">Categories</Link>
              {slug && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-[#3B302B] font-bold" aria-current="page">{currentCategoryName}</span>
                </>
              )}
            </>
          ) : isOccasionPath ? (
            <>
              <Link to="/occasions" className="hover:text-[#596B58] transition-colors">Occasions</Link>
              {slug && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-[#3B302B] font-bold" aria-current="page">{currentOccasionName}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-[#3B302B] font-bold" aria-current="page">Products</span>
          )}
        </nav>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-[#FFF8EC] border border-[#E5DEC9] p-4 sm:p-10 text-center space-y-1.5 sm:space-y-3">
        <h1 className="text-xl sm:text-4xl font-extrabold text-[#3B302B] capitalize">{titleText}</h1>
        <p className="text-[11px] sm:text-sm text-[#7A6E65] max-w-xl mx-auto">
          {t("products.catalogSubtitle", "Explore our complete selection of freshly baked cakes, pastries, sourdough breads, and hampers.")}
        </p>
      </div>

      {/* Main Search Bar & Quick Filters */}
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("products.searchPlaceholder", "Search Cakes, Pastries, Cookies, Eggless...")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-2xl border border-[#E5DEC9] bg-white text-xs sm:text-sm outline-none shadow-xs focus:border-[#596B58]"
          />
        </div>

        {/* Category & Instant Delivery Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-start sm:justify-center">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(undefined);
              setInstantOnly(false);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              !selectedCategory && !instantOnly
                ? "bg-[#3B302B] text-white ring-2 ring-[#596B58]"
                : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:bg-[#FFF8EC] hover:text-[#596B58]"
            }`}
          >
            {t("products.allItems", "🌟 All Items")}
          </button>

          <button
            type="button"
            onClick={() => {
              setInstantOnly(!instantOnly);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              instantOnly
                ? "bg-amber-500 text-white ring-2 ring-amber-300 shadow-xs"
                : "bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100"
            }`}
          >
            <span>{t("products.instantDelivery", "⚡ Ready to Deliver (Instant)")}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(selectedCategory === cat.slug ? undefined : cat.slug);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat.slug
                  ? "bg-[#3B302B] text-white ring-2 ring-[#596B58]"
                  : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:bg-[#FFF8EC] hover:text-[#596B58]"
              }`}
            >
              {getLocalizedCategoryName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid (Clean Full Width) */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (displayedProducts ? displayedProducts.length > 0 : products.length > 0) ? (
          <>
            {rowWiseLayout ? (
              <div className="space-y-8 sm:space-y-10">
                {/* Row 1 & 2: Bakery Products */}
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
                      {rowWiseLayout.bakeryDisplayProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                      {/* Last element in Bakery Row 1&2 showing more products exist */}
                      <ViewMoreCard
                        title="Explore All Cakes & Pastries"
                        subtitle={`${rowWiseLayout.totalBakeryCount}+ artisanal cakes, pastries & fresh bakes`}
                        link="/categories/cakes"
                        count={rowWiseLayout.totalBakeryCount}
                        badgeText="🍰 अभी और भी बेकरी प्रोडक्ट्स हैं"
                        buttonText={`Explore All ${rowWiseLayout.totalBakeryCount}+ Cakes`}
                      />
                    </div>
                  </div>
                )}

                {/* Row 3: Decoration Items */}
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
                      {rowWiseLayout.decorationDisplayProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                      {/* Last element in Row 3 showing more decorations exist */}
                      <ViewMoreCard
                        title="Explore Party Decorations"
                        subtitle="Metallic candles, balloon arches, toppers & poppers"
                        link="/decorations"
                        count={rowWiseLayout.totalDecorationCount}
                        badgeText="🎉 अभी और भी डेकोरेशन सामान है"
                        buttonText={`Explore All ${rowWiseLayout.totalDecorationCount}+ Decors`}
                      />
                    </div>
                  </div>
                )}

                {/* Row 4+: Mixed Remaining Products */}
                {rowWiseLayout.mixedDisplayProducts.length > 0 && (
                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#596B58]/10 text-[#596B58] border border-[#596B58]/20 shadow-2xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>✨ {t("home.rowMixedTitle", "All Delights (Mixed Collection)")}</span>
                      </span>
                      <span className="hidden sm:inline text-xs text-[#7A6E65] font-medium">
                        {t("home.rowMixedSubtitle", "Row 4+ • Complete assortment of treats")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                      {rowWiseLayout.mixedDisplayProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                      {/* Last element in Row 4+ showing entire catalog */}
                      <ViewMoreCard
                        title="Explore All Products"
                        subtitle="Browse handcrafted cakes, savory bakes & party items"
                        link="/products"
                        count={rowWiseLayout.totalProductsCount}
                        badgeText="✨ अभी और भी प्रोडक्ट्स हैं"
                        buttonText={`Explore All ${rowWiseLayout.totalProductsCount}+ Products`}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {(displayedProducts || products).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 ? (
              <div className="flex items-center justify-center gap-2 pt-6">
                {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-9 w-9 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        pagination.page === pageNum
                          ? "bg-[#596B58] text-white"
                          : "border border-[#E5DEC9] bg-[#FFF8EC] text-[#3B302B] hover:bg-[#FFF8EC]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            title={t("products.noProductsFound", "No Products Found")}
            description={t("products.noProductsDescription", "We couldn't find any products matching your search query. Try searching for something else or browse all categories.")}
            action={
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(undefined);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-[#596B58] text-white text-xs font-bold rounded-xl hover:bg-[#495948] transition-colors cursor-pointer"
              >
                {t("products.clearSearch", "Clear Search")}
              </button>
            }
          />
        )}
      </div>
    </div>
  );
};


