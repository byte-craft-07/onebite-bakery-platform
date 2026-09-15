import React from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem } from "@/services/cart.service";
import { getOptimizedImageUrl } from "@/utils/cdn.utils";

export const CartItemCard: React.FC<{
  item: CartItem;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemove: (itemId: string) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => {
  const imageUrl = getOptimizedImageUrl(
    item.productId.mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&q=75",
    { width: 140, height: 140, quality: 75 }
  );

  return (
    <div className="p-3.5 sm:p-4 border border-[#E5DEC9] rounded-2xl bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
      {/* Product info & mobile remove button */}
      <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-[#FFF8EC] shrink-0 border border-[#E5DEC9]">
            <img src={imageUrl} alt={item.productId.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <Link to={`/products/${item.productId.slug}`} className="text-xs sm:text-sm font-bold text-[#3B302B] hover:text-[#596B58] transition-colors line-clamp-1">
              {item.productId.name}
            </Link>
            <p className="text-[11px] sm:text-xs text-[#7A6E65]">₹{item.unitPrice} each</p>
          </div>
        </div>

        {/* Mobile-only trash icon button on top right */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="sm:hidden text-[#7A6E65] hover:text-red-500 transition-colors p-2 shrink-0 cursor-pointer"
          aria-label="Remove Item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Quantity stepper, Total price & desktop remove button */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5DEC9]/60">
        <div className="flex items-center border border-[#E5DEC9] rounded-xl bg-white">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="p-1.5 px-2.5 text-[#3B302B] hover:bg-[#FFF8EC] rounded-l-xl cursor-pointer active:scale-95"
            aria-label="Decrease Quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-3 text-xs font-bold text-[#3B302B]">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="p-1.5 px-2.5 text-[#3B302B] hover:bg-[#FFF8EC] rounded-r-xl cursor-pointer active:scale-95"
            aria-label="Increase Quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="text-right">
          <p className="text-sm font-extrabold text-[#3B302B]">₹{item.itemTotal}</p>
        </div>

        {/* Desktop-only trash button */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="hidden sm:block text-[#7A6E65] hover:text-red-500 transition-colors p-1 cursor-pointer"
          aria-label="Remove Item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
