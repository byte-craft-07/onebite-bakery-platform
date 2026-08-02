import React from "react";
import { Filter, RotateCcw } from "lucide-react";

import { CustomSelect } from "@/components/ui/FormControls";
import type { CategoryItem, SearchProductsQueryParams } from "@/services/catalog.service";

export interface FilterSidebarProps {
  filters: SearchProductsQueryParams;
  categories: CategoryItem[];
  onChange: (newFilters: SearchProductsQueryParams) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  categories,
  onChange,
  onReset,
}) => {
  const sortOptions = [
    { label: "Relevance", value: "relevance" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "Newest Additions", value: "newest" },
    { label: "Most Popular", value: "popular" },
    { label: "Alphabetical (A-Z)", value: "alphabetical" },
  ];

  const productTypeOptions = [
    { label: "All Types", value: "" },
    { label: "Cakes & Pastries", value: "NORMAL" },
    { label: "Combos & Boxes", value: "COMBO" },
    { label: "Custom Tier Cakes", value: "CUSTOM_CAKE" },
    { label: "Party Accessories", value: "DECORATION" },
  ];

  return (
    <div className="space-y-6 bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
        <div className="flex items-center gap-2 text-[#2C1E16] font-bold">
          <Filter className="h-4 w-4 text-[#E67E22]" />
          <span>Filters & Sort</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-[#6E5D4F] hover:text-[#E67E22] flex items-center gap-1 font-medium cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Custom Styled Sorting Dropdown */}
      <CustomSelect
        label="Sort By:"
        value={filters.sort || "relevance"}
        onChange={(val) => onChange({ ...filters, sort: val, page: 1 })}
        options={sortOptions}
      />

      {/* Custom Styled Product Type Filter Dropdown */}
      <CustomSelect
        label="Product Type:"
        value={filters.productType || ""}
        onChange={(val) => onChange({ ...filters, productType: val || undefined, page: 1 })}
        options={productTypeOptions}
      />

      {/* Category Filter */}
      {categories.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]">
            Category:
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => onChange({ ...filters, category: undefined, page: 1 })}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !filters.category ? "bg-[#FFF3E6] text-[#E67E22] font-bold" : "text-[#6E5D4F] hover:bg-[#F9F6F0]"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onChange({ ...filters, category: cat.id, page: 1 })}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filters.category === cat.id ? "bg-[#FFF3E6] text-[#E67E22] font-bold" : "text-[#6E5D4F] hover:bg-[#F9F6F0]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Price Range */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]">
          Price Range (₹):
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ""}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
            className="w-1/2 p-2 rounded-lg border border-[#E8E2D9] text-xs outline-none focus:border-[#E67E22]"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ""}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
            className="w-1/2 p-2 rounded-lg border border-[#E8E2D9] text-xs outline-none focus:border-[#E67E22]"
          />
        </div>
      </div>
    </div>
  );
};
