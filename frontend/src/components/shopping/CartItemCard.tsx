import React from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CartItem } from "@/services/cart.service";
import { getOptimizedImageUrl } from "@/utils/cdn.utils";
import { getLocalizedProductName } from "@/i18n/utils";

export const CartItemCard: React.FC<{
  item: CartItem;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemove: (itemId: string) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => {
  const { t, i18n } = useTranslation();
  const productName = getLocalizedProductName(item.productId, i18n.language);
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
            <img src={imageUrl} alt={productName} className="h-full w-full object-cover" loading="lazy" decoding="async" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <Link to={`/products/${item.productId.slug}`} className="text-xs sm:text-sm font-bold text-[#3B302B] hover:text-[#596B58] transition-colors line-clamp-1">
              {productName}
            </Link>
            <p className="text-[11px] sm:text-xs text-[#7A6E65]">₹{item.unitPrice} {t("common.each", "each")}</p>
            {item.customization && (
              <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                {Boolean(item.customization.tiers || (item.customization as any)?.tierCount) && (
                  <span className="bg-[#596B58]/10 text-[#596B58] font-bold px-1.5 py-0.5 rounded">
                    {item.customization.tiers || (item.customization as any)?.tierCount} Tier{Number(item.customization.tiers || (item.customization as any)?.tierCount) > 1 ? "s" : ""}
                  </span>
                )}
                {Boolean(item.customization.shape) && (
                  <span className="bg-amber-100 text-amber-800 font-medium px-1.5 py-0.5 rounded">
                    {item.customization.shape}
                  </span>
                )}
                {Boolean(item.customization.flavor || (item.customization as any)?.flavour) && (
                  <span className="bg-stone-100 text-stone-700 font-medium px-1.5 py-0.5 rounded max-w-[140px] truncate">
                    {item.customization.flavor || (item.customization as any)?.flavour}
                  </span>
                )}
                {Boolean(item.customization.weight || (item.customization as any)?.weightKg) && (
                  <span className="bg-sky-50 text-sky-700 font-medium px-1.5 py-0.5 rounded">
                    {item.customization.weight || `${(item.customization as any)?.weightKg} kg`}
                  </span>
                )}
                {Boolean(item.customization.message || (item.customization as any)?.messageOnCake) && (
                  <span className="bg-pink-50 text-pink-700 italic px-1.5 py-0.5 rounded max-w-[150px] truncate">
                    "{item.customization.message || (item.customization as any)?.messageOnCake}"
                  </span>
                )}
                {(item.customization.eggless !== undefined || (item.customization as any)?.isEggless !== undefined) && (
                  <span className={`px-1.5 py-0.5 rounded font-semibold ${(item.customization.eggless ?? (item.customization as any)?.isEggless) ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                    {(item.customization.eggless ?? (item.customization as any)?.isEggless) ? "Eggless" : "Regular"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile-only trash icon button on top right */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="sm:hidden text-[#7A6E65] hover:text-red-500 transition-colors p-2 shrink-0 cursor-pointer"
          aria-label={t("cart.removeItem", "Remove item")}
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
            aria-label={t("cart.decreaseQuantity", "Decrease Quantity")}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-3 text-xs font-bold text-[#3B302B]">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="p-1.5 px-2.5 text-[#3B302B] hover:bg-[#FFF8EC] rounded-r-xl cursor-pointer active:scale-95"
            aria-label={t("cart.increaseQuantity", "Increase Quantity")}
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
          aria-label={t("cart.removeItem", "Remove item")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
