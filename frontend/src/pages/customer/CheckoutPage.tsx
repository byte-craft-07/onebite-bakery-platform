import React, { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Banknote, CheckCircle2, Download, FileText, Plus, QrCode, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  AddressSelector,
  CheckoutSummary,
  DeliverySelector,
  DeliveryTimingSelector,
  StorePickupLocationCard,
  TIME_SLOTS,
} from "@/components/shopping/CheckoutComponents";
import { OrderPlacedCelebrationModal } from "@/components/shopping/OrderPlacedCelebrationModal";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/contexts/toast.context";
import { Button } from "@/components/ui/Button";
import { Card, Modal, Skeleton } from "@/components/ui/DisplayComponents";
import { Input } from "@/components/ui/FormControls";
import { addressService, type Address } from "@/services/address.service";
import { authService } from "@/services/auth.service";
import { cartService } from "@/services/cart.service";
import { checkoutService, type CheckoutPreviewResponse, type DirectOrderItem } from "@/services/checkout.service";
import { invoiceService } from "@/services/invoice.service";
import { orderService, type OrderDetails } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { razorpayService } from "@/services/razorpay.service";
import { villageService, type Village } from "@/services/village.service";

const inlineAddressSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.string().trim().email("Valid email required."),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile number required."),
  district: z.string().trim().min(2, "District is required."),
  village: z.string().trim().min(1, "Please select a village."),
  pincode: z.string().trim().regex(/^\d{6}$/, "Valid 6-digit pincode required."),
  street: z.string().trim().min(5, "Full address details required."),
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
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Instant Direct Order Item (isolated from general cart)
  const [directItem, setDirectItem] = useState<DirectOrderItem | null>(() => {
    try {
      const raw = sessionStorage.getItem("onebitebakery_direct_order_item");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [fulfillmentType, setFulfillmentType] = useState<"HOME_DELIVERY" | "STORE_PICKUP">("HOME_DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreviewResponse | null>(null);

  // Delivery Timing Preference State
  const [hasCustomCake, setHasCustomCake] = useState<boolean>(false);
  const [timingType, setTimingType] = useState<"INSTANT" | "SCHEDULED">("INSTANT");
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>(TIME_SLOTS[2]);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentStateMessage, setPaymentStateMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderDetails | null>(null);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);

  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const addressForm = useForm<InlineAddressData>({
    resolver: zodResolver(inlineAddressSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      district: "Central",
      village: "",
      pincode: "110001",
      street: "",
    },
  });

  const PENDING_ORDER_KEY = "onebitebakery_pending_upi_order_id";

  const fetchAddressesAndPreview = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const [addrList, villageList, currentCart] = await Promise.all([
        addressService.getAddresses(),
        villageService.getVillages(),
        cartService.getCart(),
      ]);
      setAddresses(addrList);
      setVillages(villageList);

      // Check if direct item or cart contains any custom cake
      const isCustomCake = directItem
        ? Boolean(
            directItem.productId.startsWith("custom") ||
            directItem.name.toLowerCase().includes("custom") ||
            directItem.customization?.message?.includes("custom")
          )
        : (currentCart.items || []).some(
            (i) =>
              i.productId.id.startsWith("custom") ||
              i.productId.slug?.includes("custom") ||
              i.productId.name?.toLowerCase().includes("custom") ||
              Boolean(i.customization),
          );
      setHasCustomCake(isCustomCake);

      if (isCustomCake) {
        setTimingType("SCHEDULED");
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduledDate(tomorrow.toISOString().split("T")[0]);
      }

      if (villageList.length > 0 && !addressForm.getValues("village")) {
        const storedLoc = authService.getStoredLocation() || user?.currentLocation;
        const matchedV =
          villageList.find(
            (v) =>
              (storedLoc?.villageId && (v.id === storedLoc.villageId || (v as unknown as { _id?: string })._id === storedLoc.villageId)) ||
              (storedLoc?.villageName && v.name.toLowerCase() === storedLoc.villageName.toLowerCase()),
          ) || villageList[0];

        if (matchedV) {
          addressForm.setValue("village", matchedV.name);
          addressForm.setValue("district", matchedV.district);
          addressForm.setValue("pincode", matchedV.pincode);
        }
      }

      const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
      const initialAddressId = selectedAddressId || defaultAddr?.id;
      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.id);
      }

      const activeAddr = addrList.find((a) => a.id === initialAddressId);
      const storedLoc = authService.getStoredLocation() || user?.currentLocation;

      const matchedVillage =
        villageList.find(
          (v) =>
            (activeAddr?.village && v.name.toLowerCase() === activeAddr.village.toLowerCase()) ||
            (activeAddr?.city && v.name.toLowerCase() === activeAddr.city.toLowerCase()) ||
            (activeAddr?.street && v.name.toLowerCase() === activeAddr.street.toLowerCase())
        ) ||
        villageList.find(
          (v) =>
            (storedLoc?.villageId && (v.id === storedLoc.villageId || (v as unknown as { _id?: string })._id === storedLoc.villageId)) ||
            (storedLoc?.villageName && v.name.toLowerCase() === storedLoc.villageName.toLowerCase())
        );

      const villageName = matchedVillage?.name || storedLoc?.villageName || activeAddr?.village || activeAddr?.city;

      // If user has neither a direct item nor cart items and no order placed, redirect to home page
      if (!directItem && (!currentCart?.items || currentCart.items.length === 0) && !placedOrder) {
        toast.info("Your Cart is Empty", "Please select items to place an order.");
        navigate("/", { replace: true });
        return;
      }

      const preview = await checkoutService.getCheckoutPreview(fulfillmentType, initialAddressId, villageName, directItem);
      setCheckoutPreview(preview);

      if (!directItem && (!preview?.items || preview.items.length === 0) && !placedOrder) {
        toast.info("Your Cart is Empty", "Please select items to place an order.");
        navigate("/", { replace: true });
        return;
      }
    } catch (_err) {
      setErrorMsg("Failed to load checkout preview.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkPendingOrderOnLoad = async () => {
      const pendingOrderId = localStorage.getItem(PENDING_ORDER_KEY);
      if (pendingOrderId) {
        try {
          const latestOrder = await orderService.getOrderById(pendingOrderId);
          const statusStr = String(latestOrder.paymentStatus || "");
          if (statusStr === "SUCCESS" || statusStr === "PAID" || latestOrder.orderStatus === "CONFIRMED") {
            orderService.addOrder(latestOrder);
            setPlacedOrder(latestOrder);
            localStorage.removeItem(PENDING_ORDER_KEY);
            return;
          }
          if (statusStr === "FAILED" || statusStr === "CANCELLED") {
            localStorage.removeItem(PENDING_ORDER_KEY);
          }
        } catch {
          localStorage.removeItem(PENDING_ORDER_KEY);
        }
      }
    };
    checkPendingOrderOnLoad();
    fetchAddressesAndPreview();
  }, [fulfillmentType, selectedAddressId]);

  useEffect(() => {
    if (!isLoading && !placedOrder && !directItem && (!checkoutPreview?.items || checkoutPreview.items.length === 0)) {
      navigate("/", { replace: true });
    }
  }, [isLoading, placedOrder, directItem, checkoutPreview, navigate]);

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
      toast.add("Delivery Address Added", `${created.name} (${created.village || created.district}) saved as address.`);
    } catch (_err) {
      toast.error("Address Error", "Could not save address. Please check fields.");
    } finally {
      setIsAddingAddress(false);
    }
  };

  const waitForPaidOrder = async (orderId: string): Promise<OrderDetails> => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const latestOrder = await orderService.getOrderById(orderId);

      const statusStr = String(latestOrder.paymentStatus || "");
      if (
        statusStr === "SUCCESS" ||
        statusStr === "PAID" ||
        statusStr === "PROCESSING" ||
        statusStr === "AUTHORIZED"
      ) {
        return latestOrder;
      }


      if (latestOrder.paymentStatus === "FAILED" || latestOrder.paymentStatus === "CANCELLED") {
        throw new Error("Payment was not completed. Please retry with UPI.");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return orderService.getOrderById(orderId);
  };


  const handlePlaceOrder = async () => {
    setErrorMsg(null);
    setPaymentStateMessage(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMsg("You are currently offline. Please connect to the internet to place your order.");
      toast.error("Offline", "An active internet connection is required to complete checkout.");
      return;
    }

    if (fulfillmentType === "HOME_DELIVERY" && !selectedAddressId) {
      if (addresses.length === 0) {
        setIsAddAddressModalOpen(true);
        return;
      }
      setErrorMsg("Please select a delivery address for Home Delivery.");
      return;
    }

    const selectedAddr = addresses.find((address) => address.id === selectedAddressId);
    const checkoutPhone = (selectedAddr?.phone || user?.phone || "9876543210").replace(/\D/g, "").slice(-10);

    const effectiveTimingType = hasCustomCake ? "SCHEDULED" : timingType;
    let deliveryPreference = "";
    if (effectiveTimingType === "SCHEDULED") {
      const formattedDate = scheduledDate
        ? new Date(scheduledDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Selected Date";
      deliveryPreference = `📅 Scheduled: ${formattedDate} (${scheduledTimeSlot})`;
    } else {
      deliveryPreference = "⚡ Instant Delivery (Within 30-45 mins)";
    }

    try {
      setIsPlacingOrder(true);
      if (paymentMethod === "COD") {
        setPaymentStateMessage("Creating your order (Cash on Delivery)...");
        const order = await checkoutService.createOrder({
          fulfillmentType,
          paymentMethod: "COD",
          addressId: selectedAddressId,
          deliveryTimingType: effectiveTimingType,
          deliveryTimePreference: deliveryPreference,
          scheduledDate: effectiveTimingType === "SCHEDULED" ? scheduledDate : undefined,
          scheduledTimeSlot: effectiveTimingType === "SCHEDULED" ? scheduledTimeSlot : undefined,
          directItem,
        });

        const codOrder: OrderDetails = {
          id: order.id,
          orderNumber: order.orderNumber,
          orderStatus: (order.orderStatus as OrderDetails["orderStatus"]) || "PENDING",
          paymentStatus: (order.paymentStatus as OrderDetails["paymentStatus"]) || "PENDING",
          paymentMethod: "COD",
          fulfillmentType,
          items: order.items && Array.isArray(order.items) && order.items.length > 0
            ? order.items.map((it: any, idx: number) => ({
                id: it.id || it._id || `item_${idx}`,
                productId: it.productId ? String(it.productId) : directItem?.productId || "",
                name: it.productName || it.productNameSnapshot || it.name || directItem?.name || "Bakery Product",
                image: it.image || it.thumbnailUrl || it.imageUrl || directItem?.mainImage,
                quantity: it.quantity || 1,
                unitPrice: it.unitPrice || it.unitPriceSnapshot || 0,
                itemTotal: it.subtotal || it.itemTotal || (it.unitPrice || 0) * (it.quantity || 1),
                isEggless: Boolean(it.customization?.eggless),
              }))
            : directItem
            ? [
                {
                  id: "item_direct_1",
                  productId: directItem.productId,
                  name: directItem.name,
                  image: directItem.mainImage,
                  quantity: directItem.quantity,
                  unitPrice: directItem.price,
                  itemTotal: directItem.itemTotal,
                  isEggless: Boolean(directItem.customization?.eggless),
                },
              ]
            : (checkoutPreview?.items || []).map((i: any, idx: number) => ({
                id: `item_${idx}`,
                productId: i.productId,
                name: i.name,
                image: i.image || i.mainImage || i.thumbnailUrl,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                itemTotal: i.itemTotal,
              })),
          subtotal: checkoutPreview?.pricing.subtotal || 0,
          deliveryFee: checkoutPreview?.pricing.deliveryFee || 0,
          taxAmount: checkoutPreview?.pricing.taxAmount || 0,
          discountAmount: checkoutPreview?.pricing.discountAmount || 0,
          totalAmount: order.totalAmount || checkoutPreview?.pricing.totalAmount || 0,
          deliveryTimingType: effectiveTimingType,
          deliveryTimePreference: deliveryPreference,
          scheduledDate: effectiveTimingType === "SCHEDULED" ? scheduledDate : undefined,
          scheduledTimeSlot: effectiveTimingType === "SCHEDULED" ? scheduledTimeSlot : undefined,
          customerName: selectedAddr?.name || user?.name || "Onebite Bakery Customer",
          customerPhone: checkoutPhone,
          addressSnapshot: selectedAddr
            ? {
                fullName: selectedAddr.name,
                phone: selectedAddr.phone,
                street: selectedAddr.street,
                city: selectedAddr.village || selectedAddr.district || "",
                state: selectedAddr.district || "",
                pincode: selectedAddr.pincode,
                landmark: selectedAddr.landmark,
              }
            : undefined,
          createdAt: new Date().toISOString(),
        };

        orderService.addOrder(codOrder);
        setPlacedOrder(codOrder);
        setIsCelebrationModalOpen(true);
        toast.success("Order Placed Successfully! 🎉", `Order #${codOrder.orderNumber} placed via Cash on Delivery.`);
        setIsPlacingOrder(false);
        setPaymentStateMessage(null);
        return;
      }

      setPaymentStateMessage("Creating your order securely...");
      const order = await checkoutService.createOrder({
        fulfillmentType,
        paymentMethod: "UPI",
        addressId: selectedAddressId,
        deliveryTimingType: effectiveTimingType,
        deliveryTimePreference: deliveryPreference,
        scheduledDate: effectiveTimingType === "SCHEDULED" ? scheduledDate : undefined,
        scheduledTimeSlot: effectiveTimingType === "SCHEDULED" ? scheduledTimeSlot : undefined,
        directItem,
      });

      localStorage.setItem(PENDING_ORDER_KEY, order.id);

      setPaymentStateMessage("Starting UPI payment...");
      const payment = await paymentService.initiatePayment({
        orderId: order.id,
        provider: "RAZORPAY",
      });

      await razorpayService.openPaymentModal({
        payment,
        customerName: selectedAddr?.name || user?.name || "Onebite Bakery Customer",
        customerEmail: user?.email && user.email.includes("@") && !user.email.endsWith(".test") ? user.email : "ajaykterha@gmail.com",
        customerPhone: checkoutPhone || "7897671632",
        onSuccess: async () => {
          setPaymentStateMessage("Payment received. Waiting for secure backend confirmation...");
          try {
            const paidOrder = await waitForPaidOrder(order.id);
            if (!paidOrder.deliveryTimingType) paidOrder.deliveryTimingType = effectiveTimingType;
            if (!paidOrder.deliveryTimePreference) paidOrder.deliveryTimePreference = deliveryPreference;
            if (!paidOrder.customerName) paidOrder.customerName = selectedAddr?.name || user?.name;
            if (!paidOrder.customerPhone) paidOrder.customerPhone = checkoutPhone;
            orderService.addOrder(paidOrder);
            setPlacedOrder(paidOrder);
            setIsCelebrationModalOpen(true);
            toast.success("Order Placed Successfully! 🎉", `Order #${paidOrder.orderNumber} confirmed & paid via UPI.`);
            localStorage.removeItem(PENDING_ORDER_KEY);
          } catch (err) {
            setErrorMsg(getCheckoutErrorMessage(err, "Payment is being verified. Please check your orders page in a moment."));
          } finally {
            setIsPlacingOrder(false);
          }
        },
        onDismiss: () => {
          setIsPlacingOrder(false);
          setPaymentStateMessage(null);
          localStorage.removeItem(PENDING_ORDER_KEY);
          setErrorMsg("UPI payment was cancelled or closed. Please retry with UPI.");
          toast.error("Payment Cancelled", "UPI checkout session was closed.");
        },
      });
    } catch (err) {
      setIsPlacingOrder(false);
      setPaymentStateMessage(null);
      setErrorMsg(getCheckoutErrorMessage(err, paymentMethod === "COD" ? "Failed to place Cash on Delivery order. Please try again." : "UPI payment could not be started. Please verify Razorpay backend keys and try again."));
    }
  };

  if (placedOrder) {
    return (
      <>
        <OrderPlacedCelebrationModal
          isOpen={isCelebrationModalOpen}
          onClose={() => setIsCelebrationModalOpen(false)}
          order={placedOrder}
        />

        <div className="py-10 sm:py-16 max-w-xl mx-auto text-center space-y-6 bg-white border border-[#E5DEC9] rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-lg">
          <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-[#27AE60] mx-auto animate-in zoom-in" />
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">Order Placed Successfully!</h1>
            <p className="text-sm text-[#7A6E65]">
              Order Number: <strong className="text-[#596B58]">{placedOrder.orderNumber}</strong>
            </p>
            <p className="text-xs text-[#27AE60] font-bold">
              Payment Method: {placedOrder.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "UPI Online Payment"} ({placedOrder.paymentStatus})
            </p>
            <p className="text-xs text-gray-400">Total Amount: Rs. {placedOrder.totalAmount}</p>
          </div>

          {placedOrder.paymentMethod === "COD" ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 text-left">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <Banknote className="h-4 w-4 text-amber-700" />
                <span>Cash on Delivery Notice</span>
              </p>
              <p>Please keep <strong>Rs. {placedOrder.totalAmount}</strong> exact cash ready when delivery agent arrives or when picking up at store.</p>
            </div>
          ) : null}

          {placedOrder.fulfillmentType === "STORE_PICKUP" ? (
            <div className="text-left space-y-2">
              <p className="text-xs font-bold text-[#3B302B] uppercase tracking-wider">Store Pickup Counter & Directions:</p>
              <StorePickupLocationCard />
            </div>
          ) : null}

          <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] text-xs text-[#7A6E65] space-y-2">
            <p className="font-bold text-[#3B302B]">Notifications queued by backend:</p>
            <p>Email, WhatsApp, and in-app order updates are handled securely from the server.</p>
            <p>Open your dashboard notifications to track delivery status updates.</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => setIsCelebrationModalOpen(true)}
              variant="outline"
              className="w-full sm:w-auto border-amber-400 text-[#596B58] hover:bg-amber-50"
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-[#27AE60]" />
              <span>View Celebration Card</span>
            </Button>

            <Button
              onClick={() => invoiceService.downloadOrderInvoice(placedOrder)}
              variant="outline"
              className="w-full sm:w-auto border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC]"
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
      </>
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
      <div className="flex items-center justify-between">
        <Link
          to="/cart"
          onClick={() => {
            sessionStorage.removeItem("onebitebakery_direct_order_item");
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Cart</span>
        </Link>

        {directItem ? (
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#596B58] fill-current" />
            <span>Instant Single-Item Checkout</span>
          </span>
        ) : null}
      </div>

      {directItem ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
          <div className="flex items-center gap-3.5 text-amber-900">
            {/* Product Image Thumbnail */}
            <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-amber-100 border border-amber-300 shrink-0 shadow-2xs">
              <img
                src={directItem.mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"}
                alt={directItem.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";
                }}
              />
              <span className="absolute bottom-0 right-0 bg-[#596B58] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-tl-md">
                x{directItem.quantity}
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#3B302B]">
                <Zap className="h-4 w-4 text-[#596B58] fill-current shrink-0" />
                <span>{directItem.name}</span>
              </div>
              <p className="text-xs text-[#596B58] font-bold">
                ₹{directItem.price} &bull; Qty: {directItem.quantity} {directItem.customization?.message ? `(${directItem.customization.message})` : ""}
              </p>
              <p className="text-[11px] text-amber-800">
                Items already in your cart remain completely safe and untouched in your cart.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("onebitebakery_direct_order_item");
              setDirectItem(null);
              window.location.href = "/checkout";
            }}
            className="px-4 py-2 bg-white border border-amber-300 text-amber-900 font-bold rounded-xl hover:bg-amber-100 transition-colors shrink-0 cursor-pointer shadow-2xs text-center"
          >
            Checkout Full Cart Instead
          </button>
        </div>
      ) : null}

      <h1 className="text-3xl font-extrabold text-[#3B302B]">
        {directItem ? "Direct Order Review" : "Checkout & Order Review"}
      </h1>

      {errorMsg ? (
        <div className="p-4 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200">
          {errorMsg}
        </div>
      ) : null}

      {paymentStateMessage ? (
        <div className="p-4 bg-[#FFF8EC] text-[#3B302B] text-xs font-semibold rounded-xl border border-[#596B58]/30">
          {paymentStateMessage}
        </div>
      ) : null}

      {!directItem && !isLoading && (!checkoutPreview || !checkoutPreview.items || checkoutPreview.items.length === 0) ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E5DEC9] shadow-sm space-y-4 my-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] flex items-center justify-center text-[#596B58]">
            <ShoppingBag className="h-8 w-8 text-[#596B58]" />
          </div>
          <h2 className="text-xl font-extrabold text-[#3B302B]">Your Checkout is Empty</h2>
          <p className="text-xs text-[#7A6E65] max-w-md mx-auto">
            You don't have any items ready for checkout. Browse our fresh artisanal cakes, combos, and treats to place an order!
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/products"
              className="px-6 py-2.5 rounded-xl bg-[#596B58] hover:bg-[#495948] text-white text-xs font-bold transition-all shadow-sm"
            >
              Explore Bakery Menu
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 rounded-xl bg-white border border-[#E5DEC9] hover:bg-[#FFF8EC] text-[#3B302B] text-xs font-bold transition-all"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Options */}
          <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-[#3B302B]">1. Fulfillment Method</h3>
            <DeliverySelector fulfillmentType={fulfillmentType} onChange={setFulfillmentType} />
          </Card>

          {fulfillmentType === "HOME_DELIVERY" ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#3B302B]">2. Delivery Address</h3>
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
                <div className="p-6 bg-[#FFF8EC] rounded-2xl border-2 border-dashed border-[#E5DEC9] text-center space-y-3">
                  <p className="text-xs text-[#7A6E65]">No delivery address found for home delivery.</p>
                  <Button size="sm" onClick={() => setIsAddAddressModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span>Create Delivery Address Now</span>
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-[#3B302B]">2. Store Pickup Location & Map Directions</h3>
              <StorePickupLocationCard />
            </Card>
          )}

          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-[#3B302B]">3. Delivery Timing Preference</h3>
            <DeliveryTimingSelector
              hasCustomCake={hasCustomCake}
              timingType={timingType}
              onTimingTypeChange={setTimingType}
              scheduledDate={scheduledDate}
              onDateChange={setScheduledDate}
              scheduledTimeSlot={scheduledTimeSlot}
              onTimeSlotChange={setScheduledTimeSlot}
            />
          </Card>

          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-[#3B302B]">4. Payment Method</h3>
            <div className="space-y-3">
              {/* Option 1: UPI */}
              <div
                onClick={() => setPaymentMethod("UPI")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === "UPI"
                    ? "border-[#596B58] bg-[#FFF8EC]/60 shadow-xs"
                    : "border-[#E5DEC9] bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === "UPI"}
                  onChange={() => setPaymentMethod("UPI")}
                  className="mt-1 text-[#596B58]"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#3B302B]">
                    <QrCode className="h-4 w-4 text-[#596B58]" />
                    <span>Pay with UPI</span>
                  </div>
                  <p className="text-xs text-[#7A6E65]">
                    Google Pay, PhonePe, Paytm, BHIM, and other UPI apps through Razorpay.
                  </p>
                </div>
              </div>

              {/* Option 2: Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === "COD"
                    ? "border-[#596B58] bg-[#FFF8EC]/60 shadow-xs"
                    : "border-[#E5DEC9] bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="mt-1 text-[#596B58]"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#3B302B]">
                    <Banknote className="h-4 w-4 text-[#27AE60]" />
                    <span>Cash on Delivery (COD)</span>
                    <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">
                      Pay at Doorstep
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6E65]">
                    Pay cash when your order is delivered to your address or collected at store.
                  </p>
                </div>
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
            onCouponChanged={fetchAddressesAndPreview}
          />

          {(() => {
            const payableAmount = checkoutPreview?.pricing
              ? Math.round(checkoutPreview.pricing.totalAmount * 100) / 100
              : 0;
            return (
              <Button onClick={handlePlaceOrder} isLoading={isPlacingOrder} className="w-full h-12 shadow-md">
                <span>
                  {paymentMethod === "COD"
                    ? `Place Order Rs. ${payableAmount} (COD)`
                    : `Pay Rs. ${payableAmount} with UPI`}
                </span>
              </Button>
            );
          })()}

          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" />
            <span>
              {paymentMethod === "COD"
                ? "100% verified order. Pay cash upon delivery."
                : "100% secure UPI payment through Razorpay."}
            </span>
          </p>
        </div>
      </div>
      )}

      {/* Inline Create Address Modal */}
      <Modal isOpen={isAddAddressModalOpen} onClose={() => setIsAddAddressModalOpen(false)} title="Create Delivery Address">
        <form onSubmit={addressForm.handleSubmit(handleCreateInlineAddress)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name *" placeholder="Recipient Name" {...addressForm.register("name")} error={addressForm.formState.errors.name?.message} />
            <Input label="Email *" type="email" placeholder="example@email.com" {...addressForm.register("email")} error={addressForm.formState.errors.email?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Mobile (Mob) *" placeholder="9876543210" maxLength={10} {...addressForm.register("phone")} error={addressForm.formState.errors.phone?.message} />
            <Input label="District *" placeholder="District Name" {...addressForm.register("district")} error={addressForm.formState.errors.district?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3B302B] flex items-center justify-between">
                <span>Village (Select Village) *</span>
                <span className="text-[10px] text-[#596B58]">Choose from list</span>
              </label>
              <select
                {...addressForm.register("village")}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  addressForm.setValue("village", selectedName);
                  const matched = villages.find((v) => v.name === selectedName);
                  if (matched) {
                    addressForm.setValue("district", matched.district);
                    addressForm.setValue("pincode", matched.pincode);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] focus:outline-none focus:border-[#596B58]"
              >
                <option value="">-- Choose Village --</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name} ({v.district})
                  </option>
                ))}
              </select>
              {addressForm.formState.errors.village?.message ? (
                <p className="text-[11px] text-red-500 font-medium">{addressForm.formState.errors.village.message}</p>
              ) : null}
            </div>

            <Input label="Pincode *" placeholder="110001" maxLength={6} {...addressForm.register("pincode")} error={addressForm.formState.errors.pincode?.message} />
          </div>

          <Input label="Address (Street / House Details) *" placeholder="House No., Street, Landmark" {...addressForm.register("street")} error={addressForm.formState.errors.street?.message} />

          <Button type="submit" className="w-full mt-4" isLoading={isAddingAddress}>
            Save Address & Select for Checkout
          </Button>
        </form>
      </Modal>
    </div>
  );
};
