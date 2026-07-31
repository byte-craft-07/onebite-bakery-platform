import React, { useState } from "react";
import { Search, Filter } from "lucide-react";

import { ProductCard } from "@/components/cards/ProductCard";
import { MOCK_PRODUCTS } from "@/data/mockData";

export const ProductsListingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Our Bakery Catalog</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Explore our collection of fresh cakes, tarts, pastries, and artisanal baked goods.
        </p>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-[#E8E2D9] rounded-2xl shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E2D9] text-sm outline-none focus:border-[#E67E22]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-[#6E5D4F]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-sm outline-none focus:border-[#E67E22] bg-white text-[#2C1E16]"
          >
            <option value="all">All Categories</option>
            <option value="Artisanal Cakes">Artisanal Cakes</option>
            <option value="Pastries & Tarts">Pastries & Tarts</option>
            <option value="Fresh Breads">Fresh Breads</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-[#E8E2D9] rounded-2xl">
          <p className="text-base text-[#6E5D4F]">No products match your search criteria.</p>
        </div>
      )}
    </div>
  );
};
