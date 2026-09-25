import React, { useState } from "react";
import {
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Sparkles,
  Tag,
  Truck,
  X,
  Zap,
} from "lucide-react";

import { Badge, Card } from "@/components/ui/DisplayComponents";
import { CustomSelect } from "@/components/ui/FormControls";
import type { Address } from "@/services/address.service";
import { cartService } from "@/services/cart.service";

export const getStoreGoogleMapsUrl = (storeQuery = "Onebite Bakery terha hamirpur Uttar Pradesh 210502") => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeQuery)}`;
};

export const StorePickupLocationCard: React.FC<{
  branchName?: string;
  address?: string;
  phone?: string;
  timing?: string;
}> = ({
  branchName = "Onebite Bakery Store",
  address = "Onebite Bakery, N 80°14, terha 25°49'43.3, 54.7\"E, hamirpur, Uttar Pradesh 210502",
  phone = "+91 7897671632",
  timing = "Open Daily: 8:00 AM - 10:30 PM",
}) => {
  const mapsUrl = getStoreGoogleMapsUrl(`${branchName} ${address}`);

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-[#E5DEC9] bg-[#FFF8EC] space-y-3.5 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-white border border-[#596B58]/30 text-[#596B58]">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#3B302B]">{branchName}</h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Ready for Fast Counter Pickup
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-[#7A6E65]">
        <p className="flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#596B58] shrink-0 mt-0.5" />
          <span>{address}</span>
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-[#7A6E65]" />
            <span>{timing}</span>
          </span>
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="flex items-center gap-1 text-[#596B58] font-bold hover:underline"
          >
            <Phone className="h-3 w-3" />
            <span>{phone}</span>
          </a>
        </div>
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2.5 px-4 rounded-xl bg-[#596B58] hover:bg-[#495948] text-[#FFF8EC] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 cursor-pointer"
        title="Open store location in Google Maps"
      >
        <Navigation className="h-4 w-4" />
        <span>📍 View on Google Maps / Get Directions</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
      </a>
    </div>
  );
};

export const DeliverySelector: React.FC<{
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  onChange: (type: "HOME_DELIVERY" | "STORE_PICKUP") => void;
  homeDeliveryEligible?: boolean;
  minimumHomeDeliveryAmount?: number;
  subtotal?: number;
}> = ({
  fulfillmentType,
  onChange,
  homeDeliveryEligible = true,
  minimumHomeDeliveryAmount = 300,
  subtotal = 0,
}) => {
  const isBelowMin = !homeDeliveryEligible && subtotal > 0 && subtotal < minimumHomeDeliveryAmount;
  const remaining = Math.max(0, minimumHomeDeliveryAmount - subtotal);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onChange("HOME_DELIVERY")}
          className={`p-4 rounded-2xl border text-left flex flex-col gap-1.5 sm:gap-2 transition-all cursor-pointer relative ${
            fulfillmentType === "HOME_DELIVERY"
              ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58] shadow-xs ring-2 ring-[#596B58]/30"
              : "border-[#E5DEC9] bg-white text-[#3B302B] hover:border-[#596B58]/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <span className="font-bold text-sm">Home Delivery</span>
            </div>
            {isBelowMin ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                Min ₹{minimumHomeDeliveryAmount}
              </span>
            ) : null}
          </div>
          <span className="text-xs opacity-80 text-[#7A6E65]">Fresh delivery straight to doorstep</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("STORE_PICKUP")}
          className={`p-4 rounded-2xl border text-left flex flex-col gap-1.5 sm:gap-2 transition-all cursor-pointer relative ${
            fulfillmentType === "STORE_PICKUP"
              ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58] shadow-xs ring-2 ring-[#596B58]/30"
              : "border-[#E5DEC9] bg-white text-[#3B302B] hover:border-[#596B58]/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <span className="font-bold text-sm">Store Pickup</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
              No Min Order
            </span>
          </div>
          <span className="text-xs opacity-80 text-[#7A6E65]">Collect from main bakery counter</span>
        </button>
      </div>

      {fulfillmentType === "HOME_DELIVERY" && isBelowMin ? (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <p className="font-bold text-amber-950 flex items-center gap-1.5">
              <span>⚠️ Minimum Order for Home Delivery: ₹{minimumHomeDeliveryAmount}</span>
            </p>
            <p className="text-[11px] text-amber-800">
              Your cart subtotal is <strong>₹{subtotal}</strong>. Add <strong>₹{remaining}</strong> more to qualify for Home Delivery, or switch to <strong>Store Pickup</strong> to order right now!
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange("STORE_PICKUP")}
            className="px-3.5 py-1.5 bg-[#596B58] hover:bg-[#495948] text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Switch to Store Pickup
          </button>
        </div>
      ) : null}
    </div>
  );
};

export const AddressSelector: React.FC<{
  addresses: Address[];
  selectedAddressId?: string;
  onSelect: (id: string) => void;
}> = ({ addresses, selectedAddressId, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {addresses.map((addr) => {
        const isSelected = addr.id === selectedAddressId;
        return (
          <div
            key={addr.id}
            onClick={() => onSelect(addr.id)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              isSelected
                ? "border-[#596B58] bg-[#FFF8EC] shadow-xs ring-2 ring-[#596B58]/30"
                : "border-[#E5DEC9] bg-white hover:border-[#596B58]/50"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#3B302B] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#596B58]" />
                  <span>{addr.name}</span>
                </span>
                {addr.isDefault ? <Badge variant="primary">Default</Badge> : null}
              </div>
              <p className="text-xs text-[#7A6E65] font-medium pt-1">{addr.street}</p>
              <p className="text-xs text-[#7A6E65]">
                {addr.village ? `${addr.village}, ` : ""}{addr.district} - {addr.pincode}
              </p>
              <p className="text-xs text-[#7A6E65]">Phone: {addr.phone}</p>
            </div>

            <div className="pt-3 flex items-center gap-2">
              <input
                type="radio"
                name="selected-address"
                checked={isSelected}
                onChange={() => onSelect(addr.id)}
                className="accent-[#596B58]"
              />
              <span className="text-xs font-semibold text-[#3B302B]">
                {isSelected ? "Selected Address" : "Deliver Here"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const CheckoutSummary: React.FC<{
  pricing: {
    subtotal: number;
    deliveryFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  onCouponChanged?: () => void;
  deliveryThreshold?: {
    minDeliveryAmount?: number;
    freeDeliveryThreshold?: number;
    isEligibleForDelivery?: boolean;
  };
  fulfillmentType?: "HOME_DELIVERY" | "STORE_PICKUP";
  onSwitchToPickup?: () => void;
}> = ({
  pricing,
  onCouponChanged,
  deliveryThreshold,
  fulfillmentType = "HOME_DELIVERY",
  onSwitchToPickup,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(pricing.discountAmount || 0);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    cartService.getCart().then((c) => {
      if (c.couponCode) {
        setAppliedCoupon(c.couponCode);
        setAppliedDiscount(c.couponDiscount || c.discountAmount || pricing.discountAmount || 0);
      }
    });
  }, [pricing.discountAmount]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const cart = await cartService.applyCoupon(couponCode, pricing.subtotal);
      const code = cart.couponCode || couponCode.trim().toUpperCase();
      const discount = cart.discountAmount || cart.couponDiscount || 0;

      setAppliedCoupon(code);
      setAppliedDiscount(discount);
      setSuccessMsg(`Coupon "${code}" applied successfully! Saved ₹${discount}`);
      setCouponCode("");
      if (onCouponChanged) onCouponChanged();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired promo code.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setIsApplying(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await cartService.removeCoupon();
      setAppliedCoupon(null);
      setAppliedDiscount(0);
      if (onCouponChanged) onCouponChanged();
    } catch {
      setAppliedCoupon(null);
    } finally {
      setIsApplying(false);
    }
  };

  const effectiveDiscount = Math.round((appliedCoupon ? appliedDiscount : pricing.discountAmount) * 100) / 100;
  const effectiveTotal = Math.max(0, Math.round((pricing.subtotal - effectiveDiscount + pricing.deliveryFee) * 100) / 100);

  return (
    <Card className="space-y-4 bg-white border-[#E5DEC9]">
      <h3 className="text-lg font-bold text-[#3B302B] border-b border-[#E5DEC9] pb-3">Order Summary</h3>

      {/* Coupon Form */}
      {!appliedCoupon ? (
        <form onSubmit={handleApplyCoupon} className="flex gap-2 pb-3 border-b border-[#E5DEC9]">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="PROMO / COUPON CODE"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E5DEC9] text-xs outline-none bg-white uppercase font-bold text-[#3B302B] focus:border-[#596B58]"
              disabled={isApplying}
            />
          </div>
          <button
            type="submit"
            disabled={isApplying || !couponCode.trim()}
            className="px-3.5 py-2 bg-[#596B58] text-[#FFF8EC] text-xs font-bold rounded-lg hover:bg-[#495948] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isApplying ? "Applying..." : "Apply"}
          </button>
        </form>
      ) : null}

      {errorMsg ? (
        <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold border border-red-200">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
      ) : null}

      {appliedCoupon ? (
        <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Coupon <strong>{appliedCoupon}</strong> Applied (-₹{effectiveDiscount})</span>
          </div>
          <button
            onClick={handleRemoveCoupon}
            disabled={isApplying}
            className="p-1 text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
            title="Remove Coupon"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Price Lines */}
      <div className="space-y-2 text-xs text-[#7A6E65]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-bold text-[#3B302B]">₹{pricing.subtotal}</span>
        </div>
        {effectiveDiscount > 0 ? (
          <div className="flex justify-between text-emerald-700 font-semibold">
            <span>Promo Discount ({appliedCoupon || "Applied"})</span>
            <span>-₹{effectiveDiscount}</span>
          </div>
        ) : null}
        <div className="flex justify-between items-center">
          <span>Delivery Fee</span>
          <span className="font-bold text-[#3B302B]">
            {pricing.deliveryFee === 0 ? <span className="text-[#596B58] bg-[#FFF8EC] px-2 py-0.5 rounded font-bold">FREE</span> : `₹${pricing.deliveryFee}`}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-[#E5DEC9] flex justify-between items-baseline">
        <span className="text-sm font-bold text-[#3B302B]">Total Amount</span>
        <span className="text-2xl font-extrabold text-[#596B58]">₹{effectiveTotal}</span>
      </div>

      {/* Dynamic Delivery Remaining Amount & Savings Status */}
      {fulfillmentType === "HOME_DELIVERY" ? (
        <div className="mt-2 pt-3 border-t border-dashed border-[#E5DEC9] space-y-2.5">
          {(() => {
            const minDelivery = deliveryThreshold?.minDeliveryAmount ?? 0;
            const isBelowMin = minDelivery > 0 && pricing.subtotal < minDelivery;
            const remainingForMin = Math.max(0, minDelivery - pricing.subtotal);

            const freeThreshold = deliveryThreshold?.freeDeliveryThreshold ?? 350;
            const remainingForFree = Math.max(0, freeThreshold - pricing.subtotal);
            const freePercent = Math.min(100, Math.round((pricing.subtotal / freeThreshold) * 100));

            if (isBelowMin) {
              return (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950 shadow-2xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-amber-900">
                      <Truck className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>Home Delivery Min Order</span>
                    </span>
                    <span className="text-amber-800 font-extrabold">₹{pricing.subtotal} / ₹{minDelivery}</span>
                  </div>
                  <div className="w-full bg-amber-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((pricing.subtotal / minDelivery) * 100))}%` }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                    <p className="text-[11px] text-amber-900">
                      Home delivery ke liye <strong>₹{remainingForMin}</strong> aur jodein.
                    </p>
                    {onSwitchToPickup ? (
                      <button
                        type="button"
                        onClick={onSwitchToPickup}
                        className="text-[10px] font-bold text-[#596B58] underline hover:text-[#495948] shrink-0 text-left cursor-pointer"
                      >
                        Pickup चुने (No Min Order)
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }

            if (pricing.deliveryFee > 0 && remainingForFree > 0) {
              return (
                <div className="p-3 bg-[#FFF8EC] border border-[#596B58]/25 rounded-xl space-y-2 text-xs text-[#3B302B] shadow-2xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-[#596B58]">
                      <Truck className="h-4 w-4 text-[#596B58] shrink-0" />
                      <span>Free Home Delivery Tracker</span>
                    </span>
                    <span className="text-[#596B58] font-extrabold text-[11px]">
                      Add ₹{remainingForFree} more
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#596B58] h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${freePercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#7A6E65]">
                    <span>Subtotal: <strong>₹{pricing.subtotal}</strong></span>
                    <span className="text-[#596B58] font-bold">Free at ₹{freeThreshold}</span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-[#E5DEC9] text-[11px] text-[#596B58] font-semibold flex items-center justify-between">
                    <span>
                      🎉 <strong>₹{remainingForFree}</strong> aur jodein aur payein <strong>FREE Delivery</strong>!
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 shadow-2xs">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  🎉 Badhai ho! Aapko <strong>FREE Home Delivery</strong> mil rahi hai!
                </span>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="mt-2 pt-3 border-t border-dashed border-[#E5DEC9]">
          <div className="p-2.5 bg-[#FFF8EC] border border-[#596B58]/25 rounded-xl text-xs text-[#596B58] flex items-center gap-2">
            <Building className="h-4 w-4 shrink-0" />
            <span className="font-semibold">
              Store Pickup selected &bull; Zero Delivery Fee &amp; Instant Counter Collection!
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export const TIME_SLOTS = [
  "10:00 AM - 01:00 PM (Morning Slot)",
  "01:00 PM - 04:00 PM (Afternoon Slot)",
  "04:00 PM - 07:00 PM (Evening Slot)",
  "07:00 PM - 10:00 PM (Night Celebration Slot)",
];

export const DeliveryTimingSelector: React.FC<{
  hasCustomCake: boolean;
  timingType: "INSTANT" | "SCHEDULED";
  onTimingTypeChange: (type: "INSTANT" | "SCHEDULED") => void;
  scheduledDate: string;
  onDateChange: (date: string) => void;
  scheduledTimeSlot: string;
  onTimeSlotChange: (slot: string) => void;
}> = ({
  hasCustomCake,
  timingType,
  onTimingTypeChange,
  scheduledDate,
  onDateChange,
  scheduledTimeSlot,
  onTimeSlotChange,
}) => {
  // Compute minimum selectable date (today for normal, tomorrow for custom cake)
  const today = new Date();
  const minDateObj = new Date(today);
  if (hasCustomCake) {
    minDateObj.setDate(minDateObj.getDate() + 1);
  }
  const minDateStr = minDateObj.toISOString().split("T")[0];

  const maxDateObj = new Date(today);
  maxDateObj.setDate(maxDateObj.getDate() + 30);
  const maxDateStr = maxDateObj.toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Notice for Custom Cakes */}
      {hasCustomCake ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <Sparkles className="h-4 w-4 text-[#596B58]" />
            <span>Custom Celebration Cake Order Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900/90">
            Your cart contains an artisanal <strong>Custom Celebration Cake</strong> which requires handcrafted preparation and baking time. <strong>Instant delivery is not available for custom cakes.</strong> Please pick your desired celebration Date & Time Slot below.
          </p>
        </div>
      ) : null}

      {/* Option Buttons: Instant vs Scheduled */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Option 1: Instant */}
        <button
          type="button"
          disabled={hasCustomCake}
          onClick={() => onTimingTypeChange("INSTANT")}
          className={`p-4 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer relative ${
            hasCustomCake
              ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
              : timingType === "INSTANT"
              ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58] shadow-xs ring-2 ring-[#596B58]/30"
              : "border-[#E5DEC9] bg-white text-[#3B302B] hover:border-[#596B58]/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${timingType === "INSTANT" && !hasCustomCake ? "text-[#596B58]" : "text-gray-400"}`} />
              <span className="font-bold text-sm">Instant / ASAP</span>
            </div>
            {timingType === "INSTANT" && !hasCustomCake ? (
              <span className="text-[10px] font-extrabold bg-[#596B58] text-[#FFF8EC] px-2 py-0.5 rounded-full">
                Active
              </span>
            ) : hasCustomCake ? (
              <span className="text-[9px] font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                Unavailable for Custom Cake
              </span>
            ) : null}
          </div>
          <span className="text-xs opacity-80 text-[#7A6E65]">Fresh delivery dispatched within 30-45 mins</span>
        </button>

        {/* Option 2: Specific Date & Time Slot */}
        <button
          type="button"
          onClick={() => onTimingTypeChange("SCHEDULED")}
          className={`p-4 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
            timingType === "SCHEDULED" || hasCustomCake
              ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58] shadow-xs ring-2 ring-[#596B58]/30"
              : "border-[#E5DEC9] bg-white text-[#3B302B] hover:border-[#596B58]/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="font-bold text-sm">Specific Date & Time Slot</span>
            </div>
            {timingType === "SCHEDULED" || hasCustomCake ? (
              <span className="text-[10px] font-extrabold bg-[#596B58] text-[#FFF8EC] px-2 py-0.5 rounded-full">
                Scheduled
              </span>
            ) : null}
          </div>
          <span className="text-xs opacity-80 text-[#7A6E65]">Choose precise date and delivery time slot</span>
        </button>
      </div>

      {/* Date & Time Slot Picker if SCHEDULED or Custom Cake */}
      {(timingType === "SCHEDULED" || hasCustomCake) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3B302B]">
            <Clock className="h-4 w-4 text-[#596B58]" />
            <span>Select Delivery Date & Time Slot</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3B302B] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#596B58]" />
                <span>Delivery Date *</span>
              </label>
              <input
                type="date"
                min={minDateStr}
                max={maxDateStr}
                value={scheduledDate || minDateStr}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5DEC9] bg-white text-xs font-semibold text-[#3B302B] outline-none focus:border-[#596B58] focus:ring-1 focus:ring-[#596B58]"
                required
              />
              <p className="text-[10px] text-[#7A6E65]">
                {hasCustomCake
                  ? "Advance booking required for fresh custom cake crafting."
                  : "Book up to 30 days in advance."}
              </p>
            </div>

            {/* Time Slot Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3B302B] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#596B58]" />
                <span>Preferred Time Slot *</span>
              </label>
              <CustomSelect
                value={scheduledTimeSlot || TIME_SLOTS[2]}
                onChange={onTimeSlotChange}
                options={TIME_SLOTS.map((slot) => ({
                  value: slot,
                  label: slot,
                }))}
              />
              <p className="text-[10px] text-[#7A6E65]">
                Our delivery partner will arrive within this designated window.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

