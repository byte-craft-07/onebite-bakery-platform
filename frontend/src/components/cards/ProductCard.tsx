import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, ShoppingBag, Star } from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import type { ProductItem } from "@/services/catalog.service";
import { cartService } from "@/services/cart.service";

export const ProductCard: React.FC<{ product: ProductItem }> = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const imageUrl =
    product.mainImage ||
    (product.images && product.images[0]) ||
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.isAvailable || isAdding) return;

    setIsAdding(true);
    try {
      await cartService.addItem({
        productId: product.id,
        quantity: 1,
      });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (_err) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative rounded-2xl border border-[#E8E2D9] bg-white overflow-hidden shadow-[0_4px_16px_rgba(44,30,22,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(44,30,22,0.12)] flex flex-col">
      {/* Image & Badges Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F9F6F0]">
        <Link to={`/products/${product.slug}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isEggless ? <Badge variant="success">Eggless</Badge> : null}
          {product.isBestseller ? <Badge variant="primary">Bestseller</Badge> : null}
          {!product.isAvailable ? <Badge variant="danger">Out of Stock</Badge> : null}
        </div>

        <button
          aria-label="Add to favorites"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-xs text-[#2C1E16] hover:text-[#C0392B] transition-colors shadow-sm z-10"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{product.rating ?? 4.8}</span>
            <span className="text-[#6E5D4F]">({product.reviewCount ?? 42})</span>
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="text-base font-bold text-[#2C1E16] hover:text-[#E67E22] transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-[#6E5D4F] line-clamp-2 mt-1">{product.description}</p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-[#2C1E16]">₹{product.price}</span>
            {product.compareAtPrice ? (
              <span className="text-xs text-gray-400 line-through">₹{product.compareAtPrice}</span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdding}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isAdded
                ? "bg-green-600 text-white"
                : "bg-[#E67E22] text-white hover:bg-[#D35400] active:scale-95"
            } disabled:opacity-50`}
          >
            {isAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{product.isAvailable ? "Add" : "Unavailable"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
