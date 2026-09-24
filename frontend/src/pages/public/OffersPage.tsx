import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  Percent,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  X,
  Zap,
} from "lucide-react";

import { Badge, Card, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { adminCouponsService, type AdminCoupon } from "@/features/admin/services/adminCoupons.service";
import { cartService } from "@/services/cart.service";

const DEFAULT_OFFERS: AdminCoupon[] = [
  {
    id: "cpn-welcome",
    code: "WELCOME100",
    description: "Flat ₹100 Off on your first celebration bakery order above ₹499",
    discountType: "FLAT",
    discountValue: 100,
    minOrderAmount: 499,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn-cake20",
    code: "CAKE20",
    description: "Get 20% instant discount on all celebration cakes & party dessert combos",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 599,
    maxDiscountAmount: 250,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn-sweet50",
    code: "ONLINE50",
    description: "Flat ₹50 Off on artisanal sourdough bread, croissants, and chocolate cookies",
    discountType: "FLAT",
    discountValue: 50,
    minOrderAmount: 299,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn-party15",
    code: "PARTY15",
    description: "Save 15% on Birthday Combos, Custom Cake studio orders & Party decorations",
    discountType: "PERCENTAGE",
    discountValue: 15,
    minOrderAmount: 899,
    maxDiscountAmount: 350,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const OffersPage: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const serverCoupons = await adminCouponsService.getCoupons();
      const activeServerCoupons = serverCoupons.filter((c) => c.isActive);
      setCoupons(activeServerCoupons);
    } catch {
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApplyDirectly = async (code: string) => {
    setApplyingCode(code);
    setFeedbackMsg(null);
    try {
      const cart = await cartService.getCart();
      const subtotal = cart.subtotal || 500;
      await cartService.applyCoupon(code, subtotal);
      setFeedbackMsg({
        type: "success",
        text: `Coupon "${code}" applied to your cart successfully!`,
      });
      window.dispatchEvent(new CustomEvent("onebitebakery_cart_updated"));
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err?.message || `Coupon "${code}" copied! Enter during checkout.`,
      });
    } finally {
      setApplyingCode(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#3B302B] via-[#4A3324] to-[#3B302B] text-white p-6 sm:p-10 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Ticket className="h-64 w-64 text-white" />
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Exclusive Deals & Promo Discounts</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Onebite Bakery Offers & Coupons
          </h1>
          <p className="text-xs sm:text-sm text-[#E5DEC9]/90">
            Enjoy artisanal cakes, fresh pastries, and celebration party packs with instant discounts.
          </p>
        </div>
      </div>

      {feedbackMsg ? (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedbackMsg.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Coupons Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#3B302B]">Available Coupons ({coupons.length})</h2>
          <span className="text-xs text-[#7A6E65]">Apply directly to your cart with 1 click</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coupons.map((coupon) => {
              const isPercentage = coupon.discountType === "PERCENTAGE";
              const discountLabel = isPercentage
                ? `${coupon.discountValue}% INSTANT OFF`
                : `FLAT ₹${coupon.discountValue} OFF`;

              return (
                <Card
                  key={coupon.id || coupon.code}
                  className="p-6 space-y-5 border-[#E5DEC9] bg-[#FFF8EC] relative overflow-hidden shadow-xs hover:border-[#596B58]/60 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="absolute -right-10 top-3 rotate-45 bg-[#596B58] text-white text-[9px] font-extrabold py-0.5 px-10 shadow-xs">
                    OFFER
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-2xl bg-[#FFF8EC] border border-[#596B58]/30 text-[#596B58] shrink-0">
                        {isPercentage ? <Percent className="h-6 w-6" /> : <Tag className="h-6 w-6" />}
                      </div>
                      <div className="space-y-1 pr-6">
                        <span className="text-lg font-extrabold text-[#3B302B] block">{discountLabel}</span>
                        <p className="text-xs text-[#7A6E65] leading-relaxed">{coupon.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#7A6E65]">
                      {coupon.minOrderAmount ? (
                        <span className="bg-white border border-[#E5DEC9] px-2.5 py-1 rounded-lg font-semibold">
                          Min. Order: ₹{coupon.minOrderAmount}
                        </span>
                      ) : null}
                      {coupon.maxDiscountAmount ? (
                        <span className="bg-white border border-[#E5DEC9] px-2.5 py-1 rounded-lg font-semibold">
                          Max Discount: ₹{coupon.maxDiscountAmount}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-dashed border-[#596B58] font-mono font-extrabold text-sm text-[#596B58]">
                      <span>{coupon.code}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="px-3 py-2 rounded-xl border border-[#E5DEC9] bg-white hover:bg-[#FFF8EC] text-[#3B302B] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Copy Code"
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-green-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-gray-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={applyingCode === coupon.code}
                        onClick={() => handleApplyDirectly(coupon.code)}
                        className="px-4 py-2 rounded-xl bg-[#3B302B] hover:bg-[#596B58] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Zap className="h-3.5 w-3.5 fill-current text-amber-300" />
                        <span>{applyingCode === coupon.code ? "Applying..." : "Apply to Cart"}</span>
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Start Shopping Callout */}
      <div className="p-6 rounded-2xl bg-[#FFF8EC] border border-[#596B58]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-[#3B302B]">Ready to celebrate?</h3>
          <p className="text-xs text-[#7A6E65]">Apply any coupon above and browse our fresh daily bakery treats.</p>
        </div>
        <Link to="/products">
          <Button className="w-full sm:w-auto shadow-md">
            <ShoppingBag className="h-4 w-4 mr-2" />
            <span>Explore Fresh Products</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
