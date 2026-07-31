import React, { useState } from "react";
import { Building, Home, MapPin, Tag, Truck } from "lucide-react";

import { Badge, Card } from "@/components/ui/DisplayComponents";
import type { Address } from "@/services/address.service";

export const DeliverySelector: React.FC<{
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  onChange: (type: "HOME_DELIVERY" | "STORE_PICKUP") => void;
}> = ({ fulfillmentType, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange("HOME_DELIVERY")}
        className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
          fulfillmentType === "HOME_DELIVERY"
            ? "border-[#E67E22] bg-[#FFF3E6] text-[#E67E22] shadow-xs"
            : "border-[#E8E2D9] bg-white text-[#2C1E16] hover:border-gray-400"
        }`}
      >
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          <span className="font-bold text-sm">Home Delivery</span>
        </div>
        <p className="text-xs opacity-80">Delivered within 3 hours to your door.</p>
      </button>

      <button
        type="button"
        onClick={() => onChange("STORE_PICKUP")}
        className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
          fulfillmentType === "STORE_PICKUP"
            ? "border-[#E67E22] bg-[#FFF3E6] text-[#E67E22] shadow-xs"
            : "border-[#E8E2D9] bg-white text-[#2C1E16] hover:border-gray-400"
        }`}
      >
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          <span className="font-bold text-sm">Store Pickup</span>
        </div>
        <p className="text-xs opacity-80">Collect from Connaught Place bakery store.</p>
      </button>
    </div>
  );
};

export const AddressSelector: React.FC<{
  addresses: Address[];
  selectedAddressId?: string;
  onSelect: (id: string) => void;
}> = ({ addresses, selectedAddressId, onSelect }) => {
  if (addresses.length === 0) {
    return (
      <Card className="text-center py-6 border-dashed">
        <p className="text-xs text-[#6E5D4F]">No saved delivery addresses. Please add an address in your profile.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((addr) => (
        <div
          key={addr.id}
          onClick={() => onSelect(addr.id)}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
            selectedAddressId === addr.id
              ? "border-[#E67E22] bg-[#FFF3E6]/60 shadow-xs"
              : "border-[#E8E2D9] bg-white hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="checkout-address"
            checked={selectedAddressId === addr.id}
            onChange={() => onSelect(addr.id)}
            className="mt-1 text-[#E67E22]"
          />
          <div className="text-xs space-y-1 text-[#6E5D4F]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#2C1E16]">{addr.name} ({addr.phone})</span>
              <Badge variant="neutral">{addr.addressType}</Badge>
              {addr.isDefault ? <Badge variant="success">Default</Badge> : null}
            </div>
            <p>{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
          </div>
        </div>
      ))}
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
}> = ({ pricing }) => {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      setAppliedCoupon(couponCode.trim().toUpperCase());
    }
  };

  return (
    <Card className="space-y-4 bg-[#FFFBF5]">
      <h3 className="text-lg font-bold text-[#2C1E16] border-b border-[#E8E2D9] pb-3">Order Summary</h3>

      {/* Coupon Placeholder */}
      <form onSubmit={handleApplyCoupon} className="flex gap-2 pb-3 border-b border-[#E8E2D9]">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Promo / Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8E2D9] text-xs outline-none bg-white uppercase"
          />
        </div>
        <button type="submit" className="px-3 py-2 bg-[#2C1E16] text-white text-xs font-bold rounded-lg hover:bg-[#E67E22] transition-colors">
          Apply
        </button>
      </form>

      {appliedCoupon ? (
        <div className="flex items-center justify-between p-2.5 bg-green-50 text-green-800 rounded-lg text-xs font-medium border border-green-200">
          <span>Coupon <strong>{appliedCoupon}</strong> Applied</span>
          <button onClick={() => setAppliedCoupon(null)} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
      ) : null}

      {/* Price Lines */}
      <div className="space-y-2 text-xs text-[#6E5D4F]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-bold text-[#2C1E16]">₹{pricing.subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span className="font-bold text-[#2C1E16]">
            {pricing.deliveryFee === 0 ? <span className="text-[#27AE60]">FREE</span> : `₹${pricing.deliveryFee}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Taxes</span>
          <span className="font-bold text-[#2C1E16]">₹{pricing.taxAmount}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-[#E8E2D9] flex justify-between items-baseline">
        <span className="text-sm font-bold text-[#2C1E16]">Total Amount</span>
        <span className="text-2xl font-extrabold text-[#E67E22]">₹{pricing.totalAmount}</span>
      </div>
    </Card>
  );
};
