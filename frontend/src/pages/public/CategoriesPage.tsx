import React, { useEffect, useState } from "react";

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
    <div className="space-y-10 pb-16">
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Product Categories</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Browse by category to find your favorite cakes, pastries, sourdough breads, and biscuits.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <p className="text-center text-[#6E5D4F]">No categories available.</p>
      )}
    </div>
  );
};
