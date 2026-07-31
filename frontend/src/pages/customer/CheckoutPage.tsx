import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

import { AddressSelector, CheckoutSummary, DeliverySelector } from "@/components/shopping/CheckoutComponents";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/DisplayComponents";
import { addressService, type Address } from "@/services/address.service";
import { checkoutService, type CheckoutPreviewResponse } from "@/services/checkout.service";

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const [fulfillmentType, setFulfillmentType] = useState<"HOME_DELIVERY" | "STORE_PICKUP">("HOME_DELIVERY");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; orderNumber: string; totalAmount: number } | null>(null);

  const fetchAddressesAndPreview = async () => {
    try {
      setIsLoading(true);
      const [addrList, preview] = await Promise.all([
        addressService.getAddresses().catch(() => []),
        checkoutService.getCheckoutPreview(fulfillmentType).catch(() => null),
      ]);
      setAddresses(addrList);
      if (addrList.length > 0 && !selectedAddressId) {
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
        setSelectedAddressId(defaultAddr?.id);
      }
      setCheckoutPreview(preview);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddressesAndPreview();
  }, [fulfillmentType]);

  const handlePlaceOrder = async () => {
    setErrorMsg(null);

    if (fulfillmentType === "HOME_DELIVERY" && !selectedAddressId) {
      setErrorMsg("Please select a delivery address for Home Delivery.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const order = await checkoutService.createOrder({
        fulfillmentType,
        addressId: fulfillmentType === "HOME_DELIVERY" ? selectedAddressId : undefined,
      });
      setPlacedOrder(order);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || "Failed to create order. Please verify cart items.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-6 bg-white border border-[#E8E2D9] rounded-3xl p-10 shadow-lg">
        <CheckCircle2 className="h-16 w-16 text-[#27AE60] mx-auto animate-in zoom-in" />
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#2C1E16]">Order Placed Successfully!</h1>
          <p className="text-sm text-[#6E5D4F]">
            Order Number: <strong className="text-[#E67E22]">{placedOrder.orderNumber}</strong>
          </p>
          <p className="text-xs text-gray-400">Total Amount: ₹{placedOrder.totalAmount}</p>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <Link to="/products">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
          <Link to="/customer/profile">
            <Button>View Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-10">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6E5D4F] hover:text-[#E67E22]">
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Cart</span>
      </Link>

      <h1 className="text-3xl font-extrabold text-[#2C1E16]">Checkout & Order Review</h1>

      {errorMsg ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
          {errorMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Options */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-[#2C1E16]">1. Fulfillment Method</h3>
            <DeliverySelector fulfillmentType={fulfillmentType} onChange={setFulfillmentType} />
          </Card>

          {fulfillmentType === "HOME_DELIVERY" ? (
            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-[#2C1E16]">2. Delivery Address</h3>
              <AddressSelector
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelect={setSelectedAddressId}
              />
            </Card>
          ) : null}

          {/* Delivery Threshold Warning */}
          {checkoutPreview?.deliveryThreshold && !checkoutPreview.deliveryThreshold.isEligibleForDelivery && fulfillmentType === "HOME_DELIVERY" ? (
            <div className="p-4 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200">
              Minimum order amount for Home Delivery is ₹{checkoutPreview.deliveryThreshold.minDeliveryAmount}.
            </div>
          ) : null}
        </div>

        {/* Right Summary */}
        <div className="space-y-4">
          <CheckoutSummary
            pricing={
              checkoutPreview?.pricing || {
                subtotal: 0,
                deliveryFee: 0,
                taxAmount: 0,
                discountAmount: 0,
                totalAmount: 0,
              }
            }
          />

          <Button onClick={handlePlaceOrder} isLoading={isPlacingOrder} className="w-full h-12 shadow-md">
            <span>Place Order</span>
          </Button>

          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" />
            <span>100% Secure Checkout. Pay on delivery or store pickup.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
