import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Search } from "lucide-react";

import { ProductCard } from "@/components/cards/ProductCard";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import {
  catalogService,
  type CategoryItem,
  type ProductItem,
  type SearchProductsQueryParams,
} from "@/services/catalog.service";

export const ProductsListingPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();

  const isCategoryPath = location.pathname.startsWith("/categories");
  const isOccasionPath = location.pathname.startsWith("/occasions");

  const [filters, setFilters] = useState<SearchProductsQueryParams>({
    page: 1,
    limit: 12,
    sort: "relevance",
    category: isCategoryPath ? slug : undefined,
    occasion: isOccasionPath ? slug : undefined,
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    catalogService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: isCategoryPath ? slug : undefined,
      occasion: isOccasionPath ? slug : undefined,
      page: 1,
    }));
  }, [slug, isCategoryPath, isOccasionPath]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await catalogService.searchProducts(filters);
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
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 12, sort: "relevance" });
  };

  const titleText = isCategoryPath && slug
    ? `Category: ${slug.replace(/-/g, " ").toUpperCase()}`
    : isOccasionPath && slug
    ? `Occasion: ${slug.replace(/-/g, " ").toUpperCase()}`
    : "Our Bakery Catalog";

  return (
    <div className="space-y-10 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[#2C1E16] capitalize">{titleText}</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Explore our complete selection of freshly baked cakes, pastries, sourdough breads, and hampers.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by cake name, SKU, or ingredient (e.g. Belgian Truffle)..."
          value={filters.q || ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined, page: 1 })}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[#E8E2D9] bg-white text-sm outline-none shadow-sm focus:border-[#E67E22]"
        />
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <FilterSidebar
            filters={filters}
            categories={categories}
            onChange={(newFilters) => setFilters(newFilters)}
            onReset={handleResetFilters}
          />
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        onClick={() => setFilters({ ...filters, page: pageNum })}
                        className={`h-9 w-9 rounded-lg text-xs font-bold transition-colors ${
                          pagination.page === pageNum
                            ? "bg-[#E67E22] text-white"
                            : "border border-[#E8E2D9] bg-[#FFFBF5] text-[#2C1E16] hover:bg-[#F9F6F0]"
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
              description="We couldn't find any products matching your search or selected category/occasion."
              action={
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#E67E22] text-white text-xs font-bold rounded-lg hover:bg-[#D35400] transition-colors"
                >
                  Clear Filters
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
