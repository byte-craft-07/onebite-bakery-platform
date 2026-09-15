import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Heart, ShoppingBag, Star, Zap } from "lucide-react";

import { toast } from "@/contexts/toast.context";
import type { ProductItem } from "@/services/catalog.service";
import { cartService } from "@/services/cart.service";
import { favoritesService } from "@/services/favorites.service";
import { reviewService } from "@/services/review.service";
import { getOptimizedImageUrl } from "@/utils/cdn.utils";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";

export const ProductCard: React.FC<{ product: ProductItem }> = ({ product }) => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isOrderingNow, setIsOrderingNow] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(() =>
    favoritesService.isFavorite(product.id)
  );

  // Extract all available product images - strictly match genuine product images
  const imageList: string[] = (() => {
    const list: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      for (const img of product.images) {
        if (img && typeof img === "string" && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      }
    } else if (Array.isArray((product as any).imageUrls) && (product as any).imageUrls.length > 0) {
      for (const img of (product as any).imageUrls) {
        if (img && typeof img === "string" && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      }
    }

    if (product.mainImage && typeof product.mainImage === "string" && product.mainImage.trim() && !list.includes(product.mainImage.trim())) {
      list.unshift(product.mainImage.trim());
    } else if ((product as any).thumbnailUrl && typeof (product as any).thumbnailUrl === "string" && (product as any).thumbnailUrl.trim() && !list.includes((product as any).thumbnailUrl.trim())) {
      list.unshift((product as any).thumbnailUrl.trim());
    }

    if (list.length === 0) {
      list.push(FALLBACK_PRODUCT_IMAGE);
    }

    return list;
  })();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Real-time Dynamic Rating from Order Ratings & Reviews System
  const [liveRatingData, setLiveRatingData] = useState<{ rating: number; reviewCount: number }>(() =>
    reviewService.getProductRating(product)
  );

  useEffect(() => {
    setLiveRatingData(reviewService.getProductRating(product));

    const handleRatingUpdate = () => {
      setLiveRatingData(reviewService.getProductRating(product));
    };

    window.addEventListener("theonlinebakery_review_submitted", handleRatingUpdate);
    window.addEventListener("theonlinebakery_order_rated", handleRatingUpdate);

    return () => {
      window.removeEventListener("theonlinebakery_review_submitted", handleRatingUpdate);
      window.removeEventListener("theonlinebakery_order_rated", handleRatingUpdate);
    };
  }, [product]);

  useEffect(() => {
    setIsFavorite(favoritesService.isFavorite(product.id));

    const handleFavUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ productId: string; isFavorite: boolean }>;
      if (customEvent.detail && customEvent.detail.productId === product.id) {
        setIsFavorite(customEvent.detail.isFavorite);
      }
    };

    window.addEventListener("theonlinebakery_favorites_updated", handleFavUpdate);
    return () => {
      window.removeEventListener("theonlinebakery_favorites_updated", handleFavUpdate);
    };
  }, [product.id]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    if (touchStartX !== null && Math.abs(e.targetTouches[0].clientX - touchStartX) > 10) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe && imageList.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
    } else if (isRightSwipe && imageList.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
    }
  };

  const activeImageUrl = getOptimizedImageUrl(
    imageList[currentImageIndex] || imageList[0] || FALLBACK_PRODUCT_IMAGE,
    { width: 600, quality: 80 }
  );

  // Compute compare price and discount percentage
  const effectiveComparePrice =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : Math.round(product.price * 1.12);

  const discountPercent = Math.max(
    5,
    Math.round(((effectiveComparePrice - product.price) / effectiveComparePrice) * 100)
  );

  const ratingValue = liveRatingData.rating;
  const reviewCountValue = liveRatingData.reviewCount;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      if (nextState) {
        await favoritesService.addFavorite(product);
        toast.add("Added to Wishlist! ❤️", `"${product.name}" saved to your favorites.`, {
          image: activeImageUrl,
        });
      } else {
        await favoritesService.removeFavorite(product.id);
        toast.delete("Removed from Wishlist", `"${product.name}" removed from favorites.`);
      }
    } catch {
      setIsFavorite(!nextState);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || isOrderingNow) return;

    if (
      product.isAvailable === false ||
      (product.stockQuantity !== undefined && product.stockQuantity <= 0)
    ) {
      setIsOutOfStock(true);
      toast.error(
        "Out of Stock",
        `"${product.name}" is currently unavailable in your selected location.`
      );
      setTimeout(() => setIsOutOfStock(false), 3000);
      return;
    }

    setIsAdding(true);
    try {
      await cartService.addItem({
        productId: product.id,
        quantity: 1,
        productDetails: {
          name: product.name,
          price: product.price,
          mainImage: activeImageUrl,
          slug: product.slug,
        },
      });
      setIsAdded(true);
      toast.add("Added to Cart!", `1x "${product.name}" (₹${product.price}) added to cart.`, {
        image: activeImageUrl,
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart"),
        },
      });
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err: any) {
      setIsOutOfStock(true);
      toast.error("Stock Unavailable", err?.message || `"${product.name}" is out of stock.`);
      setTimeout(() => setIsOutOfStock(false), 3500);
    } finally {
      setIsAdding(false);
    }
  };

  const handleOrderNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || isOrderingNow) return;

    if (
      product.isAvailable === false ||
      (product.stockQuantity !== undefined && product.stockQuantity <= 0)
    ) {
      setIsOutOfStock(true);
      setTimeout(() => setIsOutOfStock(false), 3000);
      return;
    }

    setIsOrderingNow(true);
    try {
      const directItem = {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity: 1,
        mainImage: activeImageUrl,
        itemTotal: product.price,
      };
      sessionStorage.setItem("theonlinebakery_direct_order_item", JSON.stringify(directItem));
      navigate("/checkout?direct=1");
    } finally {
      setIsOrderingNow(false);
    }
  };

  const isBestseller = product.isBestseller !== false;

  return (
    <div className="group relative rounded-2xl border border-[#E5DEC9] bg-white overflow-hidden shadow-[0_2px_12px_rgba(59,48,43,0.04)] hover:shadow-[0_8px_24px_rgba(59,48,43,0.08)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      {/* Product Image Section with Multi-Image Touch & Button Slider */}
      <div
        className="relative aspect-square w-full overflow-hidden bg-[#FFF8EC] touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          to={`/products/${product.slug || product.id}`}
          onClick={(e) => {
            if (isSwiping) e.preventDefault();
          }}
          className="block h-full w-full relative bg-[#FFF8EC]"
        >
          <img
            key={currentImageIndex}
            src={getOptimizedImageUrl(imageList[currentImageIndex] || imageList[0], { width: 380, quality: 75 })}
            alt={`${product.name} - Angle ${currentImageIndex + 1}`}
            onError={(e) => {
              if (e.currentTarget.dataset.failed !== "true") {
                e.currentTarget.dataset.failed = "true";
                e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
              }
            }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </Link>

        {/* Top-Left Indian Vegetarian Mark / Eggless Indicator */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-xs p-[3px] rounded-md shadow-xs flex items-center justify-center pointer-events-none">
          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-[1.5px] border-emerald-600 rounded-xs flex items-center justify-center p-[1.5px]">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" />
          </div>
        </div>

        {/* Manual Prev / Next Arrow Controls (Visible on mobile and on desktop hover) */}
        {imageList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous image"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/55 text-white hover:bg-black/80 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer shadow-md active:scale-90 touch-manipulation"
            >
              <ChevronLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next image"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/55 text-white hover:bg-black/80 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer shadow-md active:scale-90 touch-manipulation"
            >
              <ChevronRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </>
        )}

        {/* Out of Stock Alert or Bestseller Badge */}
        {isOutOfStock ? (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold shadow-md animate-pulse">
            Out of Stock
          </div>
        ) : isBestseller ? (
          <div className="absolute bottom-2 left-2 z-10 bg-[#596B58] text-[#FFF8EC] font-extrabold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-md shadow-xs tracking-tight">
            Best Seller
          </div>
        ) : null}

        {/* Dynamic Image Pagination Dots */}
        {imageList.length > 1 && (
          <div
            className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-md"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {imageList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`View photo ${idx + 1} of ${imageList.length}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className="p-1 flex items-center justify-center cursor-pointer touch-manipulation"
              >
                <span
                  className={`rounded-full transition-all duration-200 block ${
                    idx === currentImageIndex
                      ? "w-2.5 h-2.5 bg-[#D8BE91] shadow-xs scale-110"
                      : "w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/80 hover:bg-white hover:scale-125"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          {/* Product Title */}
          <Link to={`/products/${product.slug || product.id}`} className="block">
            <h3
              className="text-xs sm:text-sm md:text-[15px] font-bold text-[#3B302B] hover:text-[#596B58] transition-colors line-clamp-1 leading-snug"
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>

          {/* Price & Favorite Row */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base md:text-lg font-extrabold text-[#3B302B]">
                ₹{product.price}
              </span>
              <span className="text-[11px] sm:text-xs text-[#7A6E65] line-through font-normal">
                ₹{effectiveComparePrice}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-[#596B58]">
                {discountPercent}% OFF
              </span>
            </div>

            {/* Favorite / Heart Toggle Button */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="p-1 text-[#7A6E65] hover:text-[#DC2626] transition-transform active:scale-90 cursor-pointer shrink-0"
            >
              <Heart
                className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ${
                  isFavorite
                    ? "fill-[#DC2626] text-[#DC2626] scale-110"
                    : "text-[#3B302B] stroke-[1.75]"
                }`}
              />
            </button>
          </div>

          {/* Real-time Dynamic Rating & Review Count */}
          <Link
            to={`/products/${product.slug || product.id}#customer-reviews`}
            className="flex items-center gap-1 text-[11px] sm:text-xs text-[#3B302B] pt-0.5 hover:text-[#596B58] transition-colors group cursor-pointer"
          >
            <span className="font-bold text-[#3B302B]">{ratingValue.toFixed(1)}</span>
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-[#D8BE91] text-[#D8BE91] shrink-0" />
            <span className="text-[#7A6E65] font-normal group-hover:underline">({reviewCountValue} Reviews)</span>
          </Link>
        </div>

        {/* Action Buttons: Add (Secondary) & Order (Primary) */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#E5DEC9]">
          {/* Secondary "Add" Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding || isOrderingNow}
            aria-label="Add to cart"
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none min-h-[34px] sm:min-h-[38px] ${
              isOutOfStock
                ? "bg-red-50 text-red-600 border border-red-200 cursor-not-allowed"
                : isAdded
                ? "bg-[#596B58] text-[#FFF8EC] border border-[#596B58] shadow-xs"
                : "bg-transparent border border-[#596B58] text-[#596B58] hover:bg-[#A8B89A] hover:text-[#3B302B] hover:border-[#A8B89A] active:scale-95 shadow-2xs"
            }`}
          >
            {isOutOfStock ? (
              <span>Out of Stock</span>
            ) : isAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" />
                <span>{isAdding ? "..." : "Add"}</span>
              </>
            )}
          </button>

          {/* Primary "Order" Button */}
          <button
            type="button"
            onClick={handleOrderNow}
            disabled={isAdding || isOrderingNow}
            aria-label="Order now"
            className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none min-h-[34px] sm:min-h-[38px] ${
              isOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-[#596B58] text-[#FFF8EC] hover:bg-[#495948] active:scale-95 shadow-xs"
            }`}
          >
            <Zap className="h-3.5 w-3.5 fill-[#D8BE91] text-[#D8BE91] shrink-0" />
            <span>{isOrderingNow ? "..." : "Order"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
