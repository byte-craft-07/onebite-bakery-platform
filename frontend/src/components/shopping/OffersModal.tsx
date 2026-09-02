import React, { useEffect, useState } from "react";
import { Check, Copy, Sparkles, Tag, Ticket, X, Zap } from "lucide-react";

import { Modal } from "@/components/ui/DisplayComponents";
import { toast } from "@/contexts/toast.context";
import { adminCouponsService, type AdminCoupon } from "@/features/admin/services/adminCoupons.service";
import { cartService } from "@/services/cart.service";

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_OFFERS: AdminCoupon[] = [
  {
    id: "cpn-welcome",
    code: "WELCOME100",
    description: "Flat ₹100 Off on your first bakery order above ₹499",
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
    description: "Get 20% instant discount on all celebration cakes & party combos",
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
    description: "Flat ₹50 Off on artisanal pastries, tarts, and fresh sourdough breads",
    discountType: "FLAT",
    discountValue: 50,
    minOrderAmount: 299,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const OffersModal: React.FC<OffersModalProps> = ({ isOpen, onClose }) => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOffers = async () => {
    try {
      const serverCoupons = await adminCouponsService.getCoupons();
      const activeServerCoupons = serverCoupons.filter((c) => c.isActive);
      if (activeServerCoupons.length > 0) {
        setCoupons(activeServerCoupons);
      } else {
        setCoupons(DEFAULT_OFFERS);
      }
    } catch {
      setCoupons(DEFAULT_OFFERS);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOffers();
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info("Code Copied! 📋", `Promo code "${code}" copied to clipboard.`);
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
        text: `Coupon "${code}" applied to cart successfully!`,
      });
      toast.update("Promo Code Applied! 🎉", `Coupon "${code}" discount applied to your cart.`);
      window.dispatchEvent(new CustomEvent("theonlinebakery_cart_updated"));
    } catch (err: any) {
      const msg = err?.message || `Coupon "${code}" copied! Enter at checkout.`;
      setFeedbackMsg({
        type: "error",
        text: msg,
      });
      toast.error("Coupon Notice", msg);
    } finally {
      setApplyingCode(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bakery Offers & Coupons">
      <div className="space-y-4 pt-1 max-w-lg mx-auto">
        {/* Banner Header */}
        <div className="p-4 rounded-2xl bg-[#596B58] text-[#FFF8EC] shadow-md flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-extrabold text-sm">
              <Sparkles className="h-4 w-4 text-[#D8BE91]" />
              <span>Exclusive Celebration Deals</span>
            </div>
            <p className="text-xs text-[#FFF8EC]/90">Save big on every single bite today!</p>
          </div>
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
            <Ticket className="h-6 w-6 text-[#FFF8EC]" />
          </div>
        </div>

        {feedbackMsg ? (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="opacity-60 hover:opacity-100 cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        {/* Coupons List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {coupons.map((coupon) => {
            const isPercentage = coupon.discountType === "PERCENTAGE";
            const discountLabel = isPercentage
              ? `${coupon.discountValue}% OFF`
              : `₹${coupon.discountValue} FLAT OFF`;

            return (
              <div
                key={coupon.id || coupon.code}
                className="p-4 rounded-2xl border border-[#E5DEC9] bg-white hover:border-[#596B58]/60 transition-all space-y-3 shadow-xs relative overflow-hidden"
              >
                {/* Decorative Pill */}
                <div className="absolute -right-10 top-3 rotate-45 bg-[#596B58] text-[#FFF8EC] text-[9px] font-extrabold py-0.5 px-10 shadow-xs">
                  OFFER
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FFF8EC] border border-[#596B58]/30 text-[#596B58] shrink-0">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 flex-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#3B302B]">{discountLabel}</span>
                    </div>
                    <p className="text-xs text-[#7A6E65] leading-snug">
                      {coupon.description || `Applicable on orders above ₹${coupon.minOrderAmount || 0}`}
                    </p>
                    {coupon.minOrderAmount && coupon.minOrderAmount > 0 ? (
                      <span className="inline-block text-[10px] text-[#7A6E65] font-semibold">
                        Min. order value: ₹{coupon.minOrderAmount}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Code Box & Actions */}
                <div className="pt-2 border-t border-dashed border-[#E5DEC9] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8EC] border border-dashed border-[#596B58] font-mono font-extrabold text-xs text-[#596B58]">
                    <span>{coupon.code}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="px-3 py-1.5 rounded-xl border border-[#E5DEC9] hover:bg-[#FFF8EC] text-[#3B302B] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy Coupon Code"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#7A6E65]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={applyingCode === coupon.code}
                      onClick={() => handleApplyDirectly(coupon.code)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#596B58] hover:bg-[#495948] text-[#FFF8EC] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Zap className="h-3.5 w-3.5 fill-current text-[#D8BE91]" />
                      <span>{applyingCode === coupon.code ? "Applying..." : "Apply"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-xs text-[#7A6E65]">
          Tip: You can also enter promo codes directly during checkout.
        </div>
      </div>
    </Modal>
  );
};
