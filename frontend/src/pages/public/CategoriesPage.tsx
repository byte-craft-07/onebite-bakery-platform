import React from "react";

import { CategoryCard } from "@/components/cards/DomainCards";
import { MOCK_CATEGORIES } from "@/data/mockData";

export const CategoriesPage: React.FC = () => {
  return (
    <div className="space-y-10 pb-16">
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Product Categories</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Browse by category to find your favorite cakes, pastries, sourdough breads, and biscuits.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_CATEGORIES.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
};
