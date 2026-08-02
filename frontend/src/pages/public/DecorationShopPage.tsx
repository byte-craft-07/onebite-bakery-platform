import React, { useState } from "react";
import { Check, Heart, PartyPopper, ShoppingBag, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import { cartService } from "@/services/cart.service";

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
    image: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80",
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
      });
    } catch (_err) {
      // Fallback
    }
    setAddedIds((prev) => [...prev, item.id]);
    window.dispatchEvent(new Event("onebite_cart_updated"));
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== item.id));
    }, 2000);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF3E6] via-[#FFFBF5] to-[#FFF3E6] border border-[#E8E2D9] p-8 md:p-12 text-center space-y-4 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E67E22]/10 text-[#E67E22] text-xs font-bold">
          <PartyPopper className="h-4 w-4" />
          <span>Section 34 &bull; Party Decoration Accessories</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C1E16]">
          Celebration Party Decoration Shop
        </h1>
        <p className="text-sm text-[#6E5D4F] max-w-2xl mx-auto">
          Complete your bakery order with premium food-grade candles, acrylic toppers, pastel balloons, and confetti party poppers.
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {DECORATION_ITEMS.map((item) => {
          const isAdded = addedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="group relative rounded-2xl border border-[#E8E2D9] bg-white overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-[#F9F6F0]">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80";
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="primary">{item.category}</Badge>
                </div>
                <button
                  aria-label="Add to favorites"
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-xs text-[#2C1E16] hover:text-[#C0392B] transition-colors shadow-sm"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>{item.rating}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#2C1E16] line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-[#6E5D4F] line-clamp-2 mt-1">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-[#2C1E16]">₹{item.price}</span>
                    <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isAdded
                        ? "bg-green-600 text-white"
                        : "bg-[#E67E22] text-white hover:bg-[#D35400] active:scale-95"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" />
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
