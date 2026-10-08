import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { CategoryCard } from "@/components/cards/DomainCards";
import { CategoryCardSkeleton } from "@/components/cards/SkeletonCards";
import { catalogService, type CategoryItem } from "@/services/catalog.service";
import { useTranslation } from "react-i18next";
import { getLocalizedCategoryName } from "@/i18n/utils";
import { SEOHead, buildCollectionSchema } from "@/components/seo";

export const CategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    catalogService
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false));
  }, []);

  const collectionSchema = buildCollectionSchema(
    "Bakery Categories",
    "Explore our complete range of baked goods: Artisanal Cakes, Pastries & Tarts, Sourdough Breads, and Celebration Hampers.",
    categories.map((c) => ({
      name: c.name,
      url: `/categories/${c.slug}`,
      image: c.image,
    }))
  );

  return (
    <div className="space-y-6 pb-16">
      <SEOHead
        title="Bakery Categories | Cakes, Pastries & Breads"
        description="Browse handcrafted bakery categories at OneBite Bakery. Fresh artisanal cakes, french pastries, sourdough whole wheat breads, and celebration hampers."
        canonicalPath="/categories"
        breadcrumbs={[{ name: "Categories", url: "/categories" }]}
        structuredData={collectionSchema}
      />

      {/* Top Back Link & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>{t("products.backToHome", "Back to Home")}</span>
        </Link>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          <Link to="/" className="hover:text-[#596B58] transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#3B302B] font-bold" aria-current="page">Categories</span>
        </nav>
      </div>

      <div className="rounded-3xl bg-[#FFF8EC] border border-[#E5DEC9] p-6 sm:p-10 text-center space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#3B302B]">
          {t("navigation.categories", "Product Categories")}
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6E65] max-w-xl mx-auto">
          {t("products.catalogSubtitle", "Browse by category to find your favorite cakes, pastries, sourdough breads, and biscuits.")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
