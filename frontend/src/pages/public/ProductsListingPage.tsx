import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

import { ProductCard } from "@/components/cards/ProductCard";
import { EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import {
  catalogService,
  type CategoryItem,
  type ProductItem,
  type SearchProductsQueryParams,
} from "@/services/catalog.service";

import { useAuth } from "@/contexts/auth.context";

export const ProductsListingPage: React.FC = () => {
  const { currentLocation } = useAuth();
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();

  const isCategoryPath = location.pathname.startsWith("/categories");
  const isOccasionPath = location.pathname.startsWith("/occasions");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(isCategoryPath ? slug : undefined);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    catalogService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (slug && isCategoryPath) {
      setSelectedCategory(slug);
    }
  }, [slug, isCategoryPath]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params: SearchProductsQueryParams = {
        page: currentPage,
        limit: 16,
        q: searchQuery.trim() || undefined,
        category: selectedCategory,
        occasion: isOccasionPath ? slug : undefined,
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

    window.addEventListener("theonlinebakery_location_changed", handleLocationChange);
    return () => {
      window.removeEventListener("theonlinebakery_location_changed", handleLocationChange);
    };
  }, [searchQuery, selectedCategory, currentPage, currentLocation, slug]);

  const titleText = isCategoryPath && slug
    ? `Category: ${slug.replace(/-/g, " ").toUpperCase()}`
    : isOccasionPath && slug
    ? `Occasion: ${slug.replace(/-/g, " ").toUpperCase()}`
    : "Our Bakery Catalog";

  return (
    <div className="space-y-6 pb-16">
      {/* Top Back Link */}
      <Link
        to={isCategoryPath ? "/categories" : isOccasionPath ? "/occasions" : "/"}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{isCategoryPath ? "Back to Categories" : isOccasionPath ? "Back to Occasions" : "Back to Home"}</span>
      </Link>

      {/* Header Banner */}
      <div className="rounded-3xl bg-[#FFF8EC] border border-[#E5DEC9] p-4 sm:p-10 text-center space-y-1.5 sm:space-y-3">
        <h1 className="text-xl sm:text-4xl font-extrabold text-[#3B302B] capitalize">{titleText}</h1>
        <p className="text-[11px] sm:text-sm text-[#7A6E65] max-w-xl mx-auto">
          Explore our complete selection of freshly baked cakes, pastries, sourdough breads, and hampers.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Cakes, Pastries, Cookies, Eggless..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-2xl border border-[#E5DEC9] bg-white text-xs sm:text-sm outline-none shadow-xs focus:border-[#596B58]"
          />
        </div>

        {/* Category Quick Chips */}
        {categories.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-start sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(undefined);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                !selectedCategory
                  ? "bg-[#3B302B] text-white ring-2 ring-[#596B58]"
                  : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:bg-[#FFF8EC] hover:text-[#596B58]"
              }`}
            >
              🌟 All Items
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
                {cat.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Product Grid (Clean Full Width) */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 sm:h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

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
            title="No Products Found"
            description="We couldn't find any products matching your search query. Try searching for something else or browse all categories."
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
                Clear Search
              </button>
            }
          />
        )}
      </div>
    </div>
  );
};

