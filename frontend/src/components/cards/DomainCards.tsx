import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Star } from "lucide-react";

import type { MockCategory, MockCombo, MockOccasion, MockReview } from "@/data/mockData";
import { cartService } from "@/services/cart.service";
import { getOptimizedImageUrl } from "@/utils/cdn.utils";

const FALLBACK_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=360&q=75";
const FALLBACK_OCCASION_IMAGE = "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=360&q=75";

export const CategoryCard: React.FC<{ category: MockCategory }> = ({ category }) => {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group relative rounded-2xl overflow-hidden aspect-square sm:aspect-4/3 border border-[#E5DEC9] shadow-2xs hover:shadow-md transition-all flex flex-col justify-end p-3 sm:p-5 bg-[#FFF8EC]"
    >
      <img
        src={getOptimizedImageUrl(category.image || FALLBACK_CATEGORY_IMAGE, { width: 360, quality: 75 })}
        alt={category.name}
        onError={(e) => {
          if (e.currentTarget.dataset.failed !== "true") {
            e.currentTarget.dataset.failed = "true";
            e.currentTarget.src = FALLBACK_CATEGORY_IMAGE;
          }
        }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="relative z-10 text-white space-y-0.5 sm:space-y-1">
        <h3 className="text-sm sm:text-lg font-bold group-hover:text-[#D8BE91] transition-colors line-clamp-1">
          {category.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-white/80">{category.itemCount} Items</p>
      </div>
    </Link>
  );
};

export const OccasionCard: React.FC<{ occasion: MockOccasion }> = ({ occasion }) => {
  return (
    <Link
      to={`/occasions/${occasion.slug}`}
      className="group relative rounded-2xl overflow-hidden aspect-square sm:aspect-3/2 border border-[#E5DEC9] shadow-2xs hover:shadow-md transition-all flex flex-col justify-end p-3 sm:p-5 bg-[#FFF8EC]"
    >
      <img
        src={getOptimizedImageUrl(occasion.image || FALLBACK_OCCASION_IMAGE, { width: 360, quality: 75 })}
        alt={occasion.name}
        onError={(e) => {
          if (e.currentTarget.dataset.failed !== "true") {
            e.currentTarget.dataset.failed = "true";
            e.currentTarget.src = FALLBACK_OCCASION_IMAGE;
          }
        }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <div className="relative z-10 text-white space-y-0.5 sm:space-y-1">
        <h3 className="text-sm sm:text-xl font-extrabold group-hover:text-[#D8BE91] transition-colors line-clamp-1">
          {occasion.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-white/90 line-clamp-1">{occasion.tagline}</p>
      </div>
    </Link>
  );
};

export const ComboCard: React.FC<{ combo: MockCombo }> = ({ combo }) => {
  const [isAdded, setIsAdded] = useState(false);
  const navigate = useNavigate();

  const handleExploreCombo = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await cartService.addItem({
        productId: combo.id,
        quantity: 1,
        productDetails: {
          name: combo.title,
          price: combo.price,
          mainImage: combo.image,
          slug: combo.id,
        },
      });
    } catch (_err) {
      // Fallback
    }

    setIsAdded(true);
    window.dispatchEvent(new Event("onebitebakery_cart_updated"));
    setTimeout(() => {
      setIsAdded(false);
      navigate("/cart");
    }, 1200);
  };

  return (
    <div className="rounded-2xl border border-[#E5DEC9] bg-white p-4 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row gap-4 sm:gap-6 items-center">
      <div className="w-full md:w-1/3 aspect-4/3 rounded-xl overflow-hidden bg-[#FFF8EC]">
        <img
          src={getOptimizedImageUrl(combo.image || FALLBACK_CATEGORY_IMAGE, { width: 420, quality: 75 })}
          alt={combo.title}
          onError={(e) => {
            if (e.currentTarget.dataset.failed !== "true") {
              e.currentTarget.dataset.failed = "true";
              e.currentTarget.src = FALLBACK_CATEGORY_IMAGE;
            }
          }}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="w-full md:w-2/3 space-y-3">
        <h3 className="text-lg sm:text-xl font-bold text-[#3B302B]">{combo.title}</h3>
        <ul className="space-y-1.5 text-xs text-[#7A6E65]">
          {combo.items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#596B58] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-[#E5DEC9] gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-[#3B302B]">₹{combo.price}</span>
            <span className="text-xs text-[#7A6E65] line-through">₹{combo.originalPrice}</span>
          </div>

          <button
            type="button"
            onClick={handleExploreCombo}
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isAdded
                ? "bg-[#596B58] text-[#FFF8EC]"
                : "bg-[#596B58] text-[#FFF8EC] hover:bg-[#495948] active:scale-95"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Combo Added to Cart</span>
              </>
            ) : (
              <>
                <span>Explore Combo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  if (dateString === "Just now" || dateString.includes("ago")) return dateString;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  return `${Math.floor(months / 12)} years ago`;
}

export const ReviewCard: React.FC<{ review: MockReview }> = ({ review }) => {
  const prodName = review.productName || (review as any).product_name;
  const rawName = (review as any).customerName || review.name;
  const displayName =
    rawName && rawName !== "Verified Customer"
      ? rawName
      : review.userEmail
        ? review.userEmail.split("@")[0]
        : "Customer";

  const isUnsplashStock = review.avatar && (
    review.avatar.includes("unsplash.com/photo-1534528741775-53994a69daeb") ||
    review.avatar.includes("unsplash.com/photo-1494790108377-be9c29b29330") ||
    review.avatar.includes("unsplash.com/photo-1507003211169-0a1dd7228f2d")
  );

  const avatarSrc = !review.avatar || isUnsplashStock
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=596B58&color=fff&bold=true`
    : getOptimizedImageUrl(review.avatar, { width: 80, height: 80, quality: 75 });

  return (
    <div className="rounded-2xl border border-[#E5DEC9] bg-white p-4 sm:p-5 shadow-2xs space-y-3 min-w-[270px] sm:min-w-[290px] md:min-w-[320px] shrink-0 flex flex-col justify-between">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src={avatarSrc}
              alt={displayName}
              onError={(e) => {
                if (e.currentTarget.dataset.failed !== "true") {
                  e.currentTarget.dataset.failed = "true";
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=596B58&color=fff&bold=true`;
                }
              }}
              className="h-9 w-9 rounded-full object-cover border border-[#596B58]/30 shrink-0"
              loading="lazy"
              decoding="async"
            />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#3B302B] line-clamp-1">
                {displayName}
              </h4>
              <div className="flex text-[#D8BE91] text-xs">
                {Array.from({ length: Math.min(5, Math.max(1, review.rating || 5)) }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </div>
            </div>
          </div>

          {prodName ? (
            <span className="text-[10px] font-bold text-[#596B58] bg-[#FFF8EC] border border-[#596B58]/30 px-2 py-0.5 rounded-full max-w-[120px] truncate shrink-0">
              {prodName}
            </span>
          ) : null}
        </div>

        <p className="text-xs text-[#7A6E65] italic line-clamp-3 leading-relaxed">
          "{review.comment}"
        </p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#E5DEC9]/60 text-[10px] text-[#7A6E65]">
        <span className="text-[#596B58] font-semibold flex items-center gap-1">
          ✓ Verified Quality
        </span>
        <span>{formatTimeAgo((review as any).createdAt || review.date)}</span>
      </div>
    </div>
  );
};
