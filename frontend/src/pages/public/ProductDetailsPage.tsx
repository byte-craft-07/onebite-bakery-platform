import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Heart,
  Info,
  Layers,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Users,
  Utensils,
  Zap,
} from "lucide-react";

import { Badge, Skeleton } from "@/components/ui/DisplayComponents";
import { toast } from "@/contexts/toast.context";
import { useAuth } from "@/contexts/auth.context";
import { cartService } from "@/services/cart.service";
import { catalogService, type ProductItem } from "@/services/catalog.service";
import { favoritesService } from "@/services/favorites.service";
import { reviewService } from "@/services/review.service";
import { RatingModal } from "@/components/review/RatingModal";
import { getOptimizedImageUrl } from "@/utils/cdn.utils";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=85";

const COMPLEMENTARY_ANGLES = [
  "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=85",
];

export const ProductDetailsPage: React.FC = () => {
  const { currentLocation } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // --- ALL REACT HOOKS AT THE TOP (Never conditional) ---
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOrderingNow, setIsOrderingNow] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState("500g");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isOutOfStockNotice, setIsOutOfStockNotice] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [liveRatingData, setLiveRatingData] = useState<{ rating: number; reviewCount: number }>({
    rating: 4.9,
    reviewCount: 128,
  });
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<"ALL" | "5_STAR" | "4_STAR">("ALL");
  const [helpfulMap, setHelpfulMap] = useState<Record<string, number>>({});

  // 1. Fetch Product Data
  useEffect(() => {
    let isMounted = true;
    if (slug) {
      setIsLoading(true);
      catalogService
        .getProductBySlug(slug)
        .then((prod) => {
          if (isMounted) {
            setProduct(prod);
            setIsFavorite(favoritesService.isFavorite(prod.id));
            const rData = reviewService.getProductRating(prod);
            setLiveRatingData(rData);
          }
        })
        .catch(() => {
          if (isMounted) setProduct(null);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [slug, currentLocation]);

  // 2. Fetch Reviews & Listen for Ratings Updates
  useEffect(() => {
    if (product) {
      reviewService.getProductReviews(product).then((revs) => {
        setProductReviews(revs);
      });
      const rData = reviewService.getProductRating(product);
      setLiveRatingData(rData);
    }

    const handleRatingUpdate = () => {
      if (product) {
        const rData = reviewService.getProductRating(product);
        setLiveRatingData(rData);
        reviewService.getProductReviews(product).then((revs) => setProductReviews(revs));
      }
    };

    const handleFavUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ productId: string; isFavorite: boolean }>;
      if (product && customEvent.detail && customEvent.detail.productId === product.id) {
        setIsFavorite(customEvent.detail.isFavorite);
      }
    };

    window.addEventListener("theonlinebakery_review_submitted", handleRatingUpdate);
    window.addEventListener("theonlinebakery_order_rated", handleRatingUpdate);
    window.addEventListener("theonlinebakery_favorites_updated", handleFavUpdate);

    return () => {
      window.removeEventListener("theonlinebakery_review_submitted", handleRatingUpdate);
      window.removeEventListener("theonlinebakery_order_rated", handleRatingUpdate);
      window.removeEventListener("theonlinebakery_favorites_updated", handleFavUpdate);
    };
  }, [product]);

  // 3. Compute gallery images
  const detailImages = useMemo(() => {
    const list: string[] = [];
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      list.push(...product.images);
    } else if ((product as any)?.imageUrls && Array.isArray((product as any).imageUrls)) {
      list.push(...(product as any).imageUrls);
    }

    if (product?.mainImage && !list.includes(product.mainImage)) {
      list.unshift(product.mainImage);
    }

    if (list.length === 0) {
      list.push(FALLBACK_PRODUCT_IMAGE);
    }
    if (list.length === 1) {
      list.push(COMPLEMENTARY_ANGLES[0], COMPLEMENTARY_ANGLES[1]);
    } else if (list.length === 2) {
      list.push(COMPLEMENTARY_ANGLES[2]);
    }
    return list;
  }, [product]);

  const activeImageUrl = detailImages[selectedImageIndex] || detailImages[0] || FALLBACK_PRODUCT_IMAGE;

  // 4. Pricing & Discount Calculations
  const effectiveComparePrice = useMemo(() => {
    if (!product) return 0;
    return product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : Math.round(product.price * 1.15);
  }, [product]);

  const discountPercent = useMemo(() => {
    if (!product || effectiveComparePrice <= product.price) return 10;
    return Math.round(((effectiveComparePrice - product.price) / effectiveComparePrice) * 100);
  }, [product, effectiveComparePrice]);

  // 5. Actions Handlers
  const handleToggleFavorite = async () => {
    if (!product) return;
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

  const handleAddToCart = async () => {
    if (!product || isAddingToCart || isOrderingNow) return;

    if (product.isAvailable === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
      setIsOutOfStockNotice(true);
      toast.error("Out of Stock", `"${product.name}" is currently unavailable in this location.`);
      setTimeout(() => setIsOutOfStockNotice(false), 4000);
      return;
    }

    setIsAddingToCart(true);
    try {
      await cartService.addItem({
        productId: product.id,
        quantity,
        customization: {
          message: `Portion: ${selectedWeight}`,
        },
        productDetails: {
          name: product.name,
          price: product.price,
          mainImage: activeImageUrl,
          slug: product.slug,
        },
      });
      toast.add("Added to Cart! 🛒", `${quantity}x "${product.name}" (${selectedWeight}) added to your cart.`, {
        image: activeImageUrl,
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart"),
        },
      });
      navigate("/cart");
    } catch (err: any) {
      toast.error("Add to Cart Failed", err?.message || "Could not add item to cart.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleOrderNow = async () => {
    if (!product || isAddingToCart || isOrderingNow) return;

    if (product.isAvailable === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
      setIsOutOfStockNotice(true);
      setTimeout(() => setIsOutOfStockNotice(false), 4000);
      return;
    }

    setIsOrderingNow(true);
    try {
      const directItem = {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity,
        mainImage: activeImageUrl,
        customization: {
          message: `Portion: ${selectedWeight}`,
        },
        itemTotal: product.price * quantity,
      };
      sessionStorage.setItem("theonlinebakery_direct_order_item", JSON.stringify(directItem));
      navigate("/checkout?direct=1");
    } finally {
      setIsOrderingNow(false);
    }
  };

  const handleHelpfulClick = (reviewId: string) => {
    setHelpfulMap((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
    toast.success("Feedback Recorded", "Thank you for marking this review as helpful!");
  };

  const filteredReviews = productReviews.filter((r) => {
    if (reviewFilter === "5_STAR") return r.rating >= 5;
    if (reviewFilter === "4_STAR") return r.rating === 4;
    return true;
  });

  // --- CONDITIONAL RENDERS (Safe because all hooks executed) ---
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8 sm:py-12">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          <Skeleton className="h-[420px] w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-1/3 rounded-lg" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 space-y-4 max-w-lg mx-auto bg-white p-8 rounded-3xl border border-[#E5DEC9] shadow-sm">
        <h2 className="text-2xl font-black text-[#3B302B]">Product Not Found</h2>
        <p className="text-sm text-[#7A6E65]">
          The product you are looking for is currently not in our catalog or the link is invalid.
        </p>
        <Link to="/products" className="inline-block px-6 py-2.5 bg-[#596B58] text-white font-bold rounded-xl hover:bg-[#495948] transition-colors shadow-sm">
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-14 pb-20 max-w-6xl mx-auto">
      {/* Top Breadcrumb / Return Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#7A6E65] hover:text-[#596B58] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Bakery Items</span>
        </Link>

        <span className="text-xs font-semibold text-gray-400">
          Home &gt; {product.categoryId?.name || "Bakery"} &gt; <strong className="text-gray-700">{product.name}</strong>
        </span>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
        {/* Left Column: Big Image Display Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Big Featured Image Canvas */}
          <div className="relative rounded-3xl overflow-hidden border border-[#E5DEC9] bg-[#FFF8EC] shadow-lg aspect-square sm:aspect-4/3 group">
            {detailImages.map((imgSrc, idx) => (
              <img
                key={idx}
                src={getOptimizedImageUrl(imgSrc, { width: 900, quality: 85 })}
                alt={`${product.name} - View ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                  idx === selectedImageIndex ? "opacity-100 z-1" : "opacity-0 z-0 pointer-events-none"
                }`}
              />
            ))}

            {/* Top-Left Indian Vegetarian 100% Veg Mark */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg shadow-md flex items-center gap-1.5">
              <div className="w-4 h-4 border-2 border-emerald-600 rounded-xs flex items-center justify-center p-[2px]">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
              <span className="text-[11px] font-extrabold text-emerald-800 pr-1">100% Eggless</span>
            </div>

            {/* Bestseller Badge */}
            {product.isBestseller !== false ? (
              <div className="absolute bottom-4 left-4 z-10 bg-gradient-to-r from-[#D8BE91] to-[#596B58] text-white font-black text-xs px-3.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                <span>Bakery Bestseller</span>
              </div>
            ) : null}

            {/* Dynamic Dot Indicators on Image */}
            {detailImages.length > 1 && (
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                {detailImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={`Switch to photo ${idx + 1}`}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      idx === selectedImageIndex
                        ? "w-3 h-3 bg-[#E53935] ring-2 ring-white scale-110 shadow-xs"
                        : "w-2 h-2 bg-white/75 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Favorite / Wishlist Floating Button */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
              className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite ? "fill-[#DC2626] text-[#DC2626]" : "stroke-[2]"
                }`}
              />
            </button>
          </div>

          {/* High-Resolution Thumbnails Strip */}
          {detailImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
              {detailImages.map((thumb, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 shadow-2xs ${
                    idx === selectedImageIndex
                      ? "border-[#596B58] ring-2 ring-[#596B58]/30 scale-105"
                      : "border-[#E5DEC9] opacity-70 hover:opacity-100 hover:border-gray-400"
                  }`}
                >
                  <img src={thumb} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Information & Purchase (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6">
          {isOutOfStockNotice ? (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <span>⚠️ यह प्रोडक्ट अभी स्टॉक में उपलब्ध नहीं है (Out of Stock)।</span>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("theonlinebakery_open_location_modal"))}
                className="underline font-bold hover:text-red-950 cursor-pointer shrink-0"
              >
                Change Location
              </button>
            </div>
          ) : null}

          {/* Header Title & Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary">{product.productType || "ARTISANAL"}</Badge>
              <Badge variant="success">100% Freshly Baked</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#3B302B] leading-tight">
              {product.name}
            </h1>

            {/* Real Rating & Clickable Review Link */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#customer-reviews"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("customer-reviews")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#3B302B] hover:text-[#596B58] transition-colors cursor-pointer group"
                title="Click to read all verified customer reviews"
              >
                <span className="font-black text-sm sm:text-base text-[#111111]">{liveRatingData.rating.toFixed(1)}</span>
                <div className="flex items-center text-[#108A00]">
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <span className="text-gray-500 font-semibold group-hover:underline">
                  ({liveRatingData.reviewCount} Reviews)
                </span>
              </a>

              <span className="text-gray-300">•</span>

              <button
                type="button"
                onClick={() => setIsRatingModalOpen(true)}
                className="text-xs text-[#596B58] hover:text-[#495948] font-bold flex items-center gap-1 cursor-pointer bg-[#FFF8EC] hover:bg-[#F7F2E7] px-3 py-1 rounded-xl border border-[#596B58]/30 transition-colors shadow-2xs"
              >
                <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                <span>Rate this Cake</span>
              </button>
            </div>
          </div>

          {/* Price Tag with Big Highlight */}
          <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] flex items-baseline justify-between shadow-2xs">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black text-[#111111]">₹{product.price}</span>
              <span className="text-sm sm:text-base text-gray-400 line-through font-medium">₹{effectiveComparePrice}</span>
            </div>
            <span className="text-xs font-black text-white bg-[#DC2626] px-2.5 py-1 rounded-lg shadow-2xs">
              {discountPercent}% OFF
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#7A6E65] leading-relaxed">
            {product.description}
          </p>

          {/* Weight & Portion Selection */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-black uppercase tracking-wider text-[#3B302B]">
              Select Weight / Portion:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { weight: "500g", serves: "4-6 Servings" },
                { weight: "1kg", serves: "8-12 Servings" },
                { weight: "2kg", serves: "16-20 Servings" },
              ].map((wItem) => (
                <button
                  key={wItem.weight}
                  type="button"
                  onClick={() => setSelectedWeight(wItem.weight)}
                  className={`p-2.5 rounded-2xl text-center border transition-all cursor-pointer shadow-2xs ${
                    selectedWeight === wItem.weight
                      ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58] ring-2 ring-[#596B58]/30 scale-102 font-extrabold"
                      : "border-[#E5DEC9] bg-white text-[#3B302B] hover:border-gray-400 font-bold"
                  }`}
                >
                  <span className="block text-xs sm:text-sm">{wItem.weight}</span>
                  <span className="block text-[10px] text-gray-400 font-medium">{wItem.serves}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Controls & Purchase Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-[#E5DEC9] rounded-2xl bg-white h-12 shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 h-full text-gray-600 font-bold hover:bg-[#FFF8EC] rounded-l-2xl text-lg flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 text-sm font-black text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 h-full text-gray-600 font-bold hover:bg-[#FFF8EC] rounded-r-2xl text-lg flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button (White Chocolate Style) */}
              <button
                disabled={isAddingToCart || isOrderingNow}
                onClick={handleAddToCart}
                className={`flex-1 h-12 bg-gradient-to-b from-[#FFF8EC] to-[#FFF8EC] border border-[#E5DEC9] text-[#3B302B] hover:from-white hover:to-[#F8ECE0] hover:border-[#D4BFAC] hover:shadow-[0_4px_14px_rgba(61,35,20,0.18)] font-black text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-98 ${
                  isOutOfStockNotice ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-[#3B302B]" />
                <span>{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
              </button>
            </div>

            {/* Direct Order Now Button (Dark Chocolate & Gold Style) */}
            <button
              disabled={isAddingToCart || isOrderingNow}
              onClick={handleOrderNow}
              className={`w-full h-12 font-black text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 ${
                isOutOfStockNotice
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-gradient-to-b from-[#3B302B] via-[#3B302B] to-[#3B302B] border border-[#596B58] text-[#D8BE91] hover:from-[#3B302B] hover:to-[#3B302B] hover:text-[#FFF8EC] hover:shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
              }`}
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 fill-[#D8BE91] text-[#D8BE91]" />
              <span>{isOutOfStockNotice ? "Out of Stock" : isOrderingNow ? "Preparing Order..." : "Order Now (Instant Checkout)"}</span>
            </button>
          </div>

          {/* Product Highlights & Quality Assurance */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5 text-xs text-[#7A6E65]">
            <div className="flex items-center gap-2.5 text-amber-950 font-bold">
              <Clock className="h-4 w-4 text-[#596B58] shrink-0" />
              <span>⚡ 30-45 Mins Fast Delivery or Schedule anytime</span>
            </div>
            <div className="flex items-center gap-2.5 text-amber-950 font-bold">
              <ShieldCheck className="h-4 w-4 text-[#27AE60] shrink-0" />
              <span>🛡️ 100% Quality & Hygiene Guaranteed by Master Bakers</span>
            </div>
            <div className="flex items-center gap-2.5 text-amber-950 font-bold">
              <Utensils className="h-4 w-4 text-[#596B58] shrink-0" />
              <span>🌿 Prepared with Pure Vegetarian & Eggless Ingredients</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Product Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-[#3B302B]">
            <Layers className="h-4 w-4 text-[#596B58]" />
            <span>Flavor & Texture</span>
          </div>
          <p className="text-xs text-[#7A6E65]">
            Artisanal layers infused with premium cocoa, velvety creams, and rich compotes.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-[#3B302B]">
            <Info className="h-4 w-4 text-[#596B58]" />
            <span>Storage & Freshness</span>
          </div>
          <p className="text-xs text-[#7A6E65]">
            Keep refrigerated at 4°C - 8°C. For best flavor, consume within 48 hours of delivery.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-[#3B302B]">
            <Award className="h-4 w-4 text-[#27AE60]" />
            <span>Authentic Baker Certification</span>
          </div>
          <p className="text-xs text-[#7A6E65]">
            FSSAI certified, 100% food-grade packaging, and contactless safe dispatch.
          </p>
        </div>
      </div>

      {/* Real Customer Ratings & Reviews Dedicated Section */}
      <section id="customer-reviews" className="pt-8 sm:pt-12 border-t border-[#E5DEC9] space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-[#596B58] text-xs font-black uppercase tracking-wider mb-2">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>Verified Customer Feedback</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#3B302B]">
              Customer Ratings & Reviews
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6E65] mt-1">
              Real reviews submitted by verified bakery customers for {product.name}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsRatingModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#596B58] hover:bg-[#495948] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md self-start sm:self-auto"
          >
            <Star className="h-4 w-4 fill-current text-amber-200" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Rating Breakdown & Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Score Box */}
          <div className="p-6 rounded-3xl bg-[#FFF8EC] border border-[#E5DEC9] text-center space-y-3 flex flex-col items-center justify-center shadow-xs">
            <span className="text-5xl sm:text-6xl font-black text-[#3B302B] tracking-tight">
              {liveRatingData.rating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 text-[#108A00]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-[#7A6E65] font-bold">
              Based on {liveRatingData.reviewCount} verified ratings
            </p>
            <span className="inline-block text-[11px] bg-green-100 text-green-800 font-extrabold px-3 py-1 rounded-full">
              98% of customers recommend this cake
            </span>
          </div>

          {/* Center Distribution Bars */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5DEC9] space-y-2.5 flex flex-col justify-center shadow-xs md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A6E65] mb-1">
              Rating Breakdown
            </h3>
            {[
              { stars: "5 Star", count: productReviews.filter((r) => r.rating === 5).length },
              { stars: "4 Star", count: productReviews.filter((r) => r.rating === 4).length },
              { stars: "3 Star", count: productReviews.filter((r) => r.rating === 3).length },
              { stars: "2 Star", count: productReviews.filter((r) => r.rating === 2).length },
              { stars: "1 Star", count: productReviews.filter((r) => r.rating === 1).length },
            ].map((bar) => {
              const total = productReviews.length || 1;
              const pct = Math.round((bar.count / total) * 100);
              return (
                <div key={bar.stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold text-gray-700 text-[11px]">{bar.stars}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#108A00] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-gray-500 text-[11px]">
                    {pct}% ({bar.count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List with Filter Tabs */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-3 border-b border-[#E5DEC9] pb-3">
            <div className="flex items-center gap-2">
              {[
                { id: "ALL", label: `All Reviews (${productReviews.length})` },
                { id: "5_STAR", label: "5 Stars Only" },
                { id: "4_STAR", label: "4 Stars" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReviewFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    reviewFilter === tab.id
                      ? "bg-[#3B302B] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Showing {filteredReviews.length} real reviews
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                        alt={rev.name || rev.customerName}
                        className="h-9 w-9 rounded-full object-cover border border-amber-200 shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-[#3B302B]">
                            {rev.name || rev.customerName || "Verified Customer"}
                          </span>
                          <span className="inline-flex items-center text-[10px] text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.2 rounded-md font-bold">
                            ✓ Verified Buyer
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {rev.date || "Verified Order"}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[#108A00] font-black text-xs">
                      <span>{rev.rating}</span>
                      <Star className="h-3 w-3 fill-current" />
                    </div>
                  </div>

                  <p className="text-xs text-[#3B302B] leading-relaxed pt-1">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Product: {product.name}</span>
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(rev.id)}
                    className="hover:text-[#596B58] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <span>👍 Helpful</span>
                    {helpfulMap[rev.id] ? <span>({helpfulMap[rev.id]})</span> : null}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        initialProductName={product.name}
      />
    </div>
  );
};
