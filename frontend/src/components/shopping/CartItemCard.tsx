import React from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem } from "@/services/cart.service";

export const CartItemCard: React.FC<{
  item: CartItem;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemove: (itemId: string) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => {
  const imageUrl = item.productId.mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-[#E8E2D9] rounded-2xl bg-white shadow-xs">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-xl overflow-hidden bg-[#F9F6F0] shrink-0 border border-[#E8E2D9]">
          <img src={imageUrl} alt={item.productId.name} className="h-full w-full object-cover" />
        </div>
        <div className="space-y-1">
          <Link to={`/products/${item.productId.slug}`} className="text-sm font-bold text-[#2C1E16] hover:text-[#E67E22] transition-colors line-clamp-1">
            {item.productId.name}
          </Link>
          <p className="text-xs text-[#6E5D4F]">₹{item.unitPrice} each</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center border border-[#E8E2D9] rounded-lg bg-white">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="p-1.5 text-gray-500 hover:bg-[#F9F6F0] rounded-l-lg"
            aria-label="Decrease Quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-3 text-xs font-bold">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="p-1.5 text-gray-500 hover:bg-[#F9F6F0] rounded-r-lg"
            aria-label="Increase Quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="text-right">
          <p className="text-sm font-extrabold text-[#2C1E16]">₹{item.itemTotal}</p>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          aria-label="Remove Item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
