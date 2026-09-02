import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";

import { ProductCard } from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import type { ProductItem } from "@/services/catalog.service";
import { favoritesService } from "@/services/favorites.service";

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    favoritesService
      .getFavorites()
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => {
        if (showLoader) setIsLoading(false);
      });
  };

  useEffect(() => {
    loadFavorites(true);

    const handleFavUpdated = () => {
      loadFavorites(false);
    };

    window.addEventListener("theonlinebakery_favorites_updated", handleFavUpdated);
    return () => {
      window.removeEventListener("theonlinebakery_favorites_updated", handleFavUpdated);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-10">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-4">
        <EmptyState
          title="Your Wishlist is Empty"
          description="Click the heart icon on any product to save it to your favorites."
          action={
            <Link to="/products">
              <Button>Explore Products</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <Link
        to="/customer/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Account Hub</span>
      </Link>

      <div className="flex items-center gap-3 border-b border-[#E5DEC9] pb-4">
        <Heart className="h-6 w-6 text-[#C0392B] fill-current" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">
          Your Favorite Items ({favorites.length})
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {favorites.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
