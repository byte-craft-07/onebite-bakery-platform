import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Heart, PartyPopper, ShoppingBag, Star } from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import { toast } from "@/contexts/toast.context";
import { cartService } from "@/services/cart.service";
import { getOptimizedImageUrl } from "@/utils/cdn.utils";

interface DecorationItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  description: string;
}

const DECORATION_ITEMS: DecorationItem[] = [
  {
    id: "dec-1",
    name: "Golden Metallic Happy Birthday Candle Set",
    category: "Candles & Toppers",
    price: 149,
    originalPrice: 199,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    description: "Premium food-safe metallic gold candles for milestone birthday cakes.",
  },
  {
    id: "dec-2",
    name: "Pastel Balloon Arch Decoration Set (50 Pcs)",
    category: "Party Balloons",
    price: 399,
    originalPrice: 499,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    description: "Macaron pastel shade balloon arch kit with ribbon and glue dots.",
  },
  {
    id: "dec-3",
    name: "Acrylic Custom Name Cake Topper",
    category: "Cake Toppers",
    price: 249,
    originalPrice: 299,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    description: "Reusable mirrored gold acrylic topper customized for your celebration.",
  },
  {
    id: "dec-4",
    name: "Confetti Party Popper Streamer Pack",
    category: "Party Accessories",
    price: 199,
    originalPrice: 249,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    description: "Biodegradable paper confetti cannons for cake cutting moments.",
  },
];

export const DecorationShopPage: React.FC = () => {
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const handleAddToCart = async (item: DecorationItem) => {
    try {
      await cartService.addItem({
        productId: item.id,
        quantity: 1,
        productDetails: {
          name: item.name,
          price: item.price,
          mainImage: item.image,
          slug: item.id,
        },
      });
      toast.add("Party Accessory Added! 🎈", `"${item.name}" (₹${item.price}) added to cart.`, {
        image: item.image,
      });
    } catch (_err) {
      toast.add("Item Added", `"${item.name}" added to cart.`, { image: item.image });
    }
    setAddedIds((prev) => [...prev, item.id]);
    window.dispatchEvent(new Event("onebitebakery_cart_updated"));
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== item.id));
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Back Link */}
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Products</span>
      </Link>

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF8EC] via-[#FFF8EC] to-[#FFF8EC] border border-[#E5DEC9] p-8 md:p-12 text-center space-y-4 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#596B58]/10 text-[#596B58] text-xs font-bold uppercase tracking-wider">
          <PartyPopper className="h-4 w-4" />
          <span>Party Decoration Accessories</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#3B302B]">
          Celebration Party Decoration Shop
        </h1>
        <p className="text-sm text-[#7A6E65] max-w-2xl mx-auto">
          Complete your bakery order with premium food-grade candles, acrylic toppers, pastel balloons, and confetti party poppers.
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {DECORATION_ITEMS.map((item) => {
          const isAdded = addedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-[#E5DEC9] bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-square sm:aspect-4/3 overflow-hidden bg-[#FFF8EC]">
                <img
                  src={getOptimizedImageUrl(item.image, { width: 360, quality: 75 })}
                  alt={item.name}
                  onError={(e) => {
                    if (e.currentTarget.dataset.failed !== "true") {
                      e.currentTarget.dataset.failed = "true";
                      e.currentTarget.src = "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=360&q=75";
                    }
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                  <Badge variant="primary" className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5">{item.category}</Badge>
                </div>
                <button
                  aria-label="Add to favorites"
                  className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full bg-white/80 backdrop-blur-xs text-[#3B302B] hover:text-[#C0392B] transition-colors shadow-xs"
                >
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>

              <div className="p-3 sm:p-5 space-y-2 sm:space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                    <span>{item.rating}</span>
                  </div>
                  <h3 className="text-xs sm:text-base font-bold text-[#3B302B] line-clamp-1 leading-snug">{item.name}</h3>
                  <p className="text-[11px] sm:text-xs text-[#7A6E65] line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1">{item.description}</p>
                </div>

                <div className="pt-2 sm:pt-3 border-t border-[#E5DEC9] flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-sm sm:text-lg font-extrabold text-[#3B302B]">₹{item.price}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      isAdded
                        ? "bg-green-600 text-white"
                        : "bg-[#596B58] text-white hover:bg-[#495948] active:scale-95"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline">Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
