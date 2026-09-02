import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { CategoryCard } from "@/components/cards/DomainCards";
import { Skeleton } from "@/components/ui/DisplayComponents";
import { catalogService, type CategoryItem } from "@/services/catalog.service";

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    catalogService
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Back Link */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="rounded-3xl bg-[#FFF8EC] border border-[#E5DEC9] p-6 sm:p-10 text-center space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#3B302B]">Product Categories</h1>
        <p className="text-xs sm:text-sm text-[#7A6E65] max-w-xl mx-auto">
          Browse by category to find your favorite cakes, pastries, sourdough breads, and biscuits.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 sm:h-48 w-full rounded-2xl" />
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
                itemCount: category.itemCount || 12,
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-xs sm:text-sm text-[#7A6E65]">No categories available.</p>
      )}
    </div>
  );
};
