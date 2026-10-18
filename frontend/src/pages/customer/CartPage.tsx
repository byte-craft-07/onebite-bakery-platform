import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building, ShoppingBag, Tag, Ticket, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CartItemCard } from "@/components/shopping/CartItemCard";
import { OffersModal } from "@/components/shopping/OffersModal";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import { cartService, type CartResponse } from "@/services/cart.service";
import { offersService, type OfferCoupon } from "@/services/offers.service";
import { adminOperationsService } from "@/features/admin/services/adminOperations.service";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/contexts/toast.context";
import { getLocalizedProductName } from "@/i18n/utils";
import { SEOHead } from "@/components/seo";

export const CartPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [minOrderLimit, setMinOrderLimit] = useState<number>(300);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<OfferCoupon[]>([]);

  useEffect(() => {
    offersService.getActiveOffers().then((list) => {
      setAvailableOffers(list);
    }).catch(() => {});
  }, []);

  const fetchCart = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const [res, settings] = await Promise.all([
        cartService.getCart(),
        adminOperationsService.getSettings().catch(() => null),
      ]);
      setCart(res);
      if (settings && typeof settings.minOrderValue === "number") {
        setMinOrderLimit(settings.minOrderValue);
      }
    } catch (_err) {
      setCart(null);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart(true);

    const handleCartUpdated = () => {
      fetchCart(false);
    };

    window.addEventListener("onebitebakery_cart_updated", handleCartUpdated);
    window.addEventListener("onebitebakery_location_changed", handleCartUpdated);
    window.addEventListener("onebitebakery_settings_updated", handleCartUpdated);
    return () => {
      window.removeEventListener("onebitebakery_cart_updated", handleCartUpdated);
      window.removeEventListener("onebitebakery_location_changed", handleCartUpdated);
      window.removeEventListener("onebitebakery_settings_updated", handleCartUpdated);
    };
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    const item = cart?.items.find((i) => i.id === itemId);
    const itemName = getLocalizedProductName(item?.productId, i18n.language) || "Item";

    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      const updated = await cartService.updateQuantity(itemId, newQty);
      setCart(updated);
      toast.update(t("cart.title", "Cart"), t("cart.itemUpdated", { name: itemName, qty: newQty, defaultValue: `Quantity for "${itemName}" updated to ${newQty}.` }));
    } catch (_err) {
      toast.error(t("common.error", "Error"), t("cart.updateFailed", "Could not update item quantity."));
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const item = cart?.items.find((i) => i.id === itemId);
    const itemName = getLocalizedProductName(item?.productId, i18n.language) || "Item";

    try {
      const updated = await cartService.removeItem(itemId);
      setCart(updated);
      toast.delete(t("cart.title", "Cart"), t("cart.itemRemoved", { name: itemName, defaultValue: `"${itemName}" removed from your cart.` }));
    } catch (_err) {
      toast.error(t("common.error", "Error"), t("cart.removeFailed", "Could not remove item from cart."));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-10">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="py-16 max-w-2xl mx-auto text-center space-y-4">
        <SEOHead title="Your Shopping Cart" noindex={true} nofollow={true} />
        <EmptyState
          title={t("cart.emptyTitle", "Your Shopping Cart is Empty")}
          description={t("cart.emptySubtitle", "Explore our artisanal cakes, pastries, and freshly baked breads.")}
          action={
            <Link to="/products">
              <Button>
                <span>{t("common.browseProducts", "Browse Products")}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isBelowOnlineOrderLimit = minOrderLimit > 0 && cart.subtotal < minOrderLimit;
  const remainingForOnlineOrder = Math.max(0, minOrderLimit - cart.subtotal);
  const progressPercent = minOrderLimit > 0 ? Math.min(100, Math.round((cart.subtotal / minOrderLimit) * 100)) : 100;
  const appliedDiscount = Math.round((cart.discountAmount || cart.couponDiscount || 0) * 100) / 100;
  const estimatedPayable = Math.max(0, cart.subtotal - appliedDiscount);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <SEOHead title="Your Shopping Cart" noindex={true} nofollow={true} />
      {/* Top Back Link */}
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>{t("common.continueShopping", "Continue Shopping")}</span>
      </Link>

      <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-[#596B58]" />
          <h1 className="text-2xl font-bold text-[#3B302B]">
            {t("cart.cartCount", { count: cart.itemCount, defaultValue: `Your Shopping Cart (${cart.itemCount} Items)` })}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        {/* Cart Summary */}
        <Card className="space-y-4 bg-[#FFF8EC]">
          <h3 className="text-lg font-bold text-[#3B302B] border-b border-[#E5DEC9] pb-3">
            {t("cart.subtotalSummary", "Subtotal Summary")}
          </h3>
          <div className="flex justify-between items-baseline text-sm text-[#7A6E65]">
            <span>{t("cart.itemsSubtotal", "Items Subtotal")}</span>
            <span className={appliedDiscount > 0 ? "text-base font-bold text-[#7A6E65] line-through" : "text-xl font-extrabold text-[#3B302B]"}>
              ₹{cart.subtotal}
            </span>
          </div>

          {appliedDiscount > 0 && (
            <div className="flex justify-between items-center text-sm text-emerald-700 font-bold bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-emerald-600" />
                <span>Coupon ({cart.couponCode}):</span>
              </span>
              <span className="text-base font-extrabold">-₹{appliedDiscount}</span>
            </div>
          )}

          {appliedDiscount > 0 && (
            <div className="flex justify-between items-baseline text-sm pt-2 border-t border-[#E5DEC9]">
              <span className="font-bold text-[#3B302B]">{t("cart.payableSubtotal", "Payable Subtotal")}</span>
              <span className="text-2xl font-extrabold text-emerald-800">
                ₹{estimatedPayable}
              </span>
            </div>
          )}

          {minOrderLimit > 0 && (
            <div className="flex justify-between items-center text-xs text-[#7A6E65] pt-1">
              <span>{t("cart.onlineOrderLowerLimit", "Online Order Lower Limit (ऑनलाइन ऑर्डर न्यूनतम सीमा):")}</span>
              <span className="font-bold text-[#3B302B]">₹{minOrderLimit}</span>
            </div>
          )}

          {/* Online Order Minimum Price Limit Eligibility Notice */}
          {isBelowOnlineOrderLimit ? (
            <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-xl space-y-2.5 text-xs text-red-950 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-red-900">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-red-700 shrink-0" />
                  <span>{t("cart.onlineOrderMinLimit", "Online Order Min Limit (न्यूनतम सीमा)")}</span>
                </span>
                <span className="font-extrabold">₹{cart.subtotal} / ₹{minOrderLimit}</span>
              </div>

              <div className="w-full bg-red-200/80 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="font-extrabold text-red-900 text-xs leading-snug">
                {t(
                  "cart.notEligibleForOnlineOrder",
                  "🚫 You are not eligible for online order because you are not full fill requirement."
                )}
              </p>
              <p className="font-bold text-red-900 text-xs leading-snug">
                🚫 आप ऑनलाइन ऑर्डर के लिए पात्र नहीं हैं क्योंकि आप न्यूनतम आवश्यकता पूरी नहीं कर रहे हैं।
              </p>
              <p className="text-[11px] text-red-800 leading-relaxed">
                {t("cart.notEligibleHindiText", {
                  min: minOrderLimit,
                  subtotal: cart.subtotal,
                  remaining: remainingForOnlineOrder,
                  defaultValue: `ऑनलाइन ऑर्डर (होम डिलीवरी) के लिए न्यूनतम ऑर्डर मूल्य ₹${minOrderLimit} होना ज़रूरी है (आपका ऑर्डर: ₹${cart.subtotal}, अभी ₹${remainingForOnlineOrder} कम है)। कृपया स्टोर से पिकअप कर लो (Store Pickup) या कार्ट में ₹${remainingForOnlineOrder} के आइटम और जोड़ें!`,
                })}
              </p>

              <div className="space-y-2 pt-1">
                <Link
                  to={isAuthenticated ? "/checkout?fulfillment=STORE_PICKUP" : "/auth/login?redirect=/checkout?fulfillment=STORE_PICKUP"}
                  className="block"
                >
                  <Button className="w-full bg-[#596B58] hover:bg-[#495948]">
                    <Building className="h-4 w-4 mr-1.5" />
                    <span>{t("cart.storePickupBtn", "🏪 स्टोर से पिकअप कर लो (Store Pickup)")}</span>
                  </Button>
                </Link>
                <Link to="/products" className="block">
                  <Button variant="outline" className="w-full border-red-300 text-red-900 hover:bg-red-100/60">
                    <span>
                      {t("cart.addMoreForOnlineOrderBtn", {
                        remaining: remainingForOnlineOrder,
                        defaultValue: `+ ₹${remainingForOnlineOrder} और जोड़ें (Add ₹${remainingForOnlineOrder} More)`,
                      })}
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                {t("cart.eligibleForOnlineOrder", {
                  min: minOrderLimit,
                  defaultValue: `✅ ऑनलाइन ऑर्डर के लिए पात्र (Eligible for Online Order • Min ₹${minOrderLimit})`,
                })}
              </span>
            </div>
          )}

          {/* Offers & Discounts Box */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5DEC9] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#3B302B]">
                <Ticket className="h-4 w-4 text-[#596B58]" />
                <span>{t("cart.bakeryOffers", "Bakery Offers & Coupons")}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOffersModalOpen(true)}
                className="text-xs font-bold text-[#596B58] hover:text-[#3B302B] hover:underline cursor-pointer"
              >
                {t("cart.viewOffers", "View All")}
              </button>
            </div>

            {cart.couponCode ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Coupon <strong>{cart.couponCode}</strong> applied (-₹{cart.discountAmount || cart.couponDiscount || 0})</span>
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await cartService.removeCoupon();
                    fetchCart();
                  }}
                  className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[11px] text-[#7A6E65]">
                  {t("cart.applyOfferPrompt", "Save more on your order with exclusive deals:")}
                </p>
                {availableOffers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {availableOffers.slice(0, 3).map((offer) => (
                      <button
                        key={offer.code}
                        type="button"
                        onClick={() => setIsOffersModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-[#FFF8EC] border border-dashed border-[#596B58] hover:bg-[#596B58] hover:text-[#FFF8EC] text-[#3B302B] font-mono font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                        title={offer.description}
                      >
                        <Tag className="h-2.5 w-2.5" />
                        <span>{offer.code}</span>
                        <span className="text-[9px] font-sans font-semibold opacity-80">
                          ({offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`})
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsOffersModalOpen(true)}
                    className="text-xs text-[#596B58] font-bold hover:underline cursor-pointer"
                  >
                    View available bakery promo codes &rarr;
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            {t("cart.taxesNotice", "Taxes and delivery fees calculated during checkout preview.")}
          </p>

          {!isBelowOnlineOrderLimit && (
            <div className="pt-2">
              <Link
                to={isAuthenticated ? "/checkout" : "/auth/login?redirect=/checkout"}
                className="block"
              >
                <Button className="w-full">
                  <span>{t("cart.proceedToCheckout", "Proceed to Checkout")}</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      <OffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
        onCouponApplied={() => fetchCart()}
      />
    </div>
  );
};
