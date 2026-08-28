import React, { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, FileText, Plus, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AddressSelector, CheckoutSummary, DeliverySelector } from "@/components/shopping/CheckoutComponents";
import { useAuth } from "@/contexts/auth.context";
import { Button } from "@/components/ui/Button";
import { Card, Modal, Skeleton } from "@/components/ui/DisplayComponents";
import { Input } from "@/components/ui/FormControls";
import { addressService, type Address } from "@/services/address.service";
import { authService } from "@/services/auth.service";
import { checkoutService, type CheckoutPreviewResponse } from "@/services/checkout.service";
import { invoiceService } from "@/services/invoice.service";
import { orderService, type OrderDetails } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { razorpayService } from "@/services/razorpay.service";

const inlineAddressSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Valid 10-digit phone required."),
  street: z.string().trim().min(5, "Full street address required."),
  city: z.string().trim().min(2, "City required."),
  state: z.string().trim().min(2, "State required."),
  pincode: z.string().trim().regex(/^\d{6}$/, "Valid 6-digit pincode required."),
  landmark: z.string().trim().optional(),
});

type InlineAddressData = z.infer<typeof inlineAddressSchema>;

const isGenericBackendMessage = (message?: string): boolean =>
  !message || message.trim().toLowerCase() === "something went wrong";

const getCheckoutErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    const responseData = err.response?.data as
      | { message?: string; error?: { message?: string }; code?: string }
      | undefined;
    const apiMessage = responseData?.error?.message || responseData?.message;

    if (apiMessage && !isGenericBackendMessage(apiMessage)) {
      return apiMessage;
    }

    if (err.response?.status === 401) {
      return "Your checkout session expired. Please login again and retry payment.";
    }

    if (err.response?.status === 429) {
      return "Too many checkout attempts. Please wait a minute and try again.";
    }

    return fallback;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
};

export const CheckoutPage: React.FC = () => {
  const { user, login } = useAuth();
  const [fulfillmentType, setFulfillmentType] = useState<"HOME_DELIVERY" | "STORE_PICKUP">("HOME_DELIVERY");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentStateMessage, setPaymentStateMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderDetails | null>(null);

  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const addressForm = useForm<InlineAddressData>({
    resolver: zodResolver(inlineAddressSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
    },
  });

  const fetchAddressesAndPreview = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const addrList = await addressService.getAddresses();
      setAddresses(addrList);

      const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }

      const preview = await checkoutService.getCheckoutPreview(fulfillmentType);
      setCheckoutPreview(preview);
    } catch (_err) {
      setErrorMsg("Failed to load checkout preview.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddressesAndPreview();
  }, [fulfillmentType]);

  const handleCreateInlineAddress = async (data: InlineAddressData) => {
    setIsAddingAddress(true);
    try {
      const created = await addressService.createAddress({
        ...data,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setIsAddAddressModalOpen(false);
      addressForm.reset();
    } catch (_err) {
      // Fallback
    } finally {
      setIsAddingAddress(false);
    }
  };

  const waitForPaidOrder = async (orderId: string): Promise<OrderDetails> => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const latestOrder = await orderService.getOrderById(orderId);

      if (latestOrder.paymentStatus === "SUCCESS" || latestOrder.paymentStatus === "PAID") {
        return latestOrder;
      }

      if (latestOrder.paymentStatus === "FAILED" || latestOrder.paymentStatus === "CANCELLED") {
        throw new Error("Payment was not completed. Please retry with UPI.");
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error("Payment is being verified. Please check your orders page in a moment.");
  };

  const handlePlaceOrder = async () => {
    setErrorMsg(null);
    setPaymentStateMessage(null);

    if (fulfillmentType === "HOME_DELIVERY" && !selectedAddressId) {
      if (addresses.length === 0) {
        setIsAddAddressModalOpen(true);
        return;
      }
      setErrorMsg("Please select a delivery address for Home Delivery.");
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    const checkoutPhone = (selectedAddr?.phone || user?.phone || "9876543210").replace(/\D/g, "").slice(-10);

    try {
      setIsPlacingOrder(true);
      if (import.meta.env.DEV) {
        const backendUser = await authService.ensureDevBackendSession(checkoutPhone);
        login(backendUser);
      }

      setPaymentStateMessage("Creating your order securely...");
      const order = await checkoutService.createOrder({
        fulfillmentType,
        addressId: selectedAddressId,
      });

      setPaymentStateMessage("Starting UPI payment...");
      const payment = await paymentService.initiatePayment({
        orderId: order.id,
        provider: "RAZORPAY",
      });

      await razorpayService.openPaymentModal({
        payment,
        customerName: selectedAddr?.name || user?.name || "OneBite Customer",
        customerEmail: user?.email && user.email.includes("@") && !user.email.endsWith(".test") ? user.email : "ajaykterha@gmail.com",
        customerPhone: checkoutPhone || "7897671632",
        onSuccess: async () => {
          setPaymentStateMessage("Payment received. Waiting for secure backend confirmation...");
          try {
            const paidOrder = await waitForPaidOrder(order.id);
            orderService.addOrder(paidOrder);
            setPlacedOrder(paidOrder);
          } catch (err) {
            setErrorMsg(getCheckoutErrorMessage(err, "Payment is being verified. Please check your orders page in a moment."));
          } finally {
            setIsPlacingOrder(false);
          }
        },
        onDismiss: () => {
          setIsPlacingOrder(false);
          setPaymentStateMessage(null);
          setErrorMsg("UPI payment was cancelled or closed. Please retry with UPI.");
        },
      });
    } catch (err) {
      setIsPlacingOrder(false);
      setPaymentStateMessage(null);
      setErrorMsg(getCheckoutErrorMessage(err, "UPI payment could not be started. Please verify Razorpay backend keys and try again."));
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
          <p className="text-xs text-[#27AE60] font-bold">Payment Status: {placedOrder.paymentStatus}</p>
          <p className="text-xs text-gray-400">Total Amount: Rs. {placedOrder.totalAmount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFBF5] border border-[#E8E2D9] text-xs text-[#6E5D4F] space-y-2">
          <p className="font-bold text-[#2C1E16]">Notifications queued by backend:</p>
          <p>Email, WhatsApp, and in-app order updates are handled securely from the server.</p>
          <p>Open your dashboard notifications to track delivery status updates.</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => invoiceService.downloadOrderInvoice(placedOrder)}
            variant="outline"
            className="w-full sm:w-auto border-[#E67E22] text-[#E67E22] hover:bg-[#FFF3E6]"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Download Tax Invoice PDF</span>
          </Button>

          <Link to="/customer/dashboard" className="w-full sm:w-auto">
            <Button className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              <span>Track Order on Dashboard</span>
            </Button>
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
        <div className="p-4 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200">
          {errorMsg}
        </div>
      ) : null}

      {paymentStateMessage ? (
        <div className="p-4 bg-[#FFF3E6] text-[#2C1E16] text-xs font-semibold rounded-xl border border-[#E67E22]/30">
          {paymentStateMessage}
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#2C1E16]">2. Delivery Address</h3>
                <Button size="sm" variant="outline" onClick={() => setIsAddAddressModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>Add New Address</span>
                </Button>
              </div>

              {addresses.length > 0 ? (
                <AddressSelector
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                />
              ) : (
                <div className="p-6 bg-[#FFFBF5] rounded-2xl border-2 border-dashed border-[#E8E2D9] text-center space-y-3">
                  <p className="text-xs text-[#6E5D4F]">No delivery address found for home delivery.</p>
                  <Button size="sm" onClick={() => setIsAddAddressModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span>Create Delivery Address Now</span>
                  </Button>
                </div>
              )}
            </Card>
          ) : null}

          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-[#2C1E16]">3. Payment</h3>
            <div className="p-4 rounded-2xl border border-[#E67E22] bg-[#FFF3E6]/60">
              <div className="font-bold text-sm text-[#2C1E16]">Pay with UPI</div>
              <div className="text-xs text-[#6E5D4F] mt-1">
                Google Pay, PhonePe, Paytm, BHIM, and other UPI apps through Razorpay.
              </div>
            </div>
          </Card>
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
            <span>Pay Rs. {checkoutPreview?.pricing.totalAmount ?? 0} with UPI</span>
          </Button>

          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" />
            <span>100% secure UPI payment through Razorpay.</span>
          </p>
        </div>
      </div>

      {/* Inline Create Address Modal */}
      <Modal isOpen={isAddAddressModalOpen} onClose={() => setIsAddAddressModalOpen(false)} title="Create Delivery Address">
        <form onSubmit={addressForm.handleSubmit(handleCreateInlineAddress)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Recipient Name" placeholder="Ananya Sharma" {...addressForm.register("name")} error={addressForm.formState.errors.name?.message} />
            <Input label="Recipient Phone" placeholder="7897671632" {...addressForm.register("phone")} error={addressForm.formState.errors.phone?.message} />
          </div>

          <Input label="Street Address" placeholder="Flat 402, Sunshine Heights, Connaught Place" {...addressForm.register("street")} error={addressForm.formState.errors.street?.message} />

          <div className="grid grid-cols-3 gap-3">
            <Input label="City" placeholder="New Delhi" {...addressForm.register("city")} error={addressForm.formState.errors.city?.message} />
            <Input label="State" placeholder="Delhi" {...addressForm.register("state")} error={addressForm.formState.errors.state?.message} />
            <Input label="Pincode" placeholder="110001" maxLength={6} {...addressForm.register("pincode")} error={addressForm.formState.errors.pincode?.message} />
          </div>

          <Button type="submit" className="w-full mt-4" isLoading={isAddingAddress}>
            Save Address & Select for Checkout
          </Button>
        </form>
      </Modal>
    </div>
  );
};
