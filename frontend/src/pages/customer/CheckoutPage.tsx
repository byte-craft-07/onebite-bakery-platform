import React, { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  Lock,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
import { CustomSelect, Input } from "@/components/ui/FormControls";
import { addressService, type Address } from "@/services/address.service";
import { authService } from "@/services/auth.service";
import { cartService } from "@/services/cart.service";
import { checkoutService, type CheckoutPreviewResponse, type DirectOrderItem } from "@/services/checkout.service";
import { invoiceService } from "@/services/invoice.service";
import { orderService, type OrderDetails } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { razorpayService } from "@/services/razorpay.service";
import { villageService, type Village } from "@/services/village.service";
import { adminOperationsService } from "@/features/admin/services/adminOperations.service";

/**
 * Build a clean, standards-compliant UPI payment URI.
 *
 * IMPORTANT: Do NOT use URLSearchParams here — it encodes `@` as `%40`,
 * which corrupts the VPA (e.g. `7897671632%40okbizaxis`). UPI apps like
 * PhonePe do NOT decode `%40` back to `@`, causing them to fall back to
 * phone-number resolution and connect to the wrong VPA entirely.
 *
 * The `@` in the UPI ID (pa) MUST remain a literal character.
 *
 * Only includes the four required parameters:
 *   pa (payee address), pn (payee name), am (amount), cu (currency).
 *
 * The `tn` (transaction note) parameter is intentionally omitted because
 * business UPI handles (e.g. @okbizaxis) can reject payments that include
 * extra parameters not registered with the merchant's PSP.
 *
 * Amount is formatted to exactly 2 decimal places (e.g. "100.00") per
 * NPCI UPI specification.
 */
const buildUpiUri = (upiId: string, amount: number): string => {
  // Format amount to exactly 2 decimal places to avoid floating point artifacts
  const formattedAmount = Number(amount).toFixed(2);

  // encodeURIComponent for payee name only (handles spaces → %20)
  // Keep pa= with literal @ — UPI apps expect unencoded @ in VPA
  const payeeName = encodeURIComponent("Onebite Bakery");

  return `upi://pay?pa=${upiId.trim()}&pn=${payeeName}&am=${formattedAmount}&cu=INR`;
};

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
  const { t } = useTranslation();
  const { user, updateCurrentLocation } = useAuth();
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
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "MANUAL_UPI" | "COD">("UPI");
  const [bakeryUpiId, setBakeryUpiId] = useState<string>("7897671632-2@ybl");
  const [bakeryUpiQr, setBakeryUpiQr] = useState<string>("");
  const [isDownloadingQr, setIsDownloadingQr] = useState<boolean>(false);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [isCopiedUpi, setIsCopiedUpi] = useState<boolean>(false);
  const [manualUpiStep, setManualUpiStep] = useState<1 | 2>(1);
  const [qrCropMode, setQrCropMode] = useState<"cropped" | "full" | "dynamic">("cropped");

  // Cash on Delivery (COD) 50% Advance UPI State
  const [codStep, setCodStep] = useState<1 | 2>(1);
  const [codReceiptPreview, setCodReceiptPreview] = useState<string | null>(null);
  const [codTransactionId, setCodTransactionId] = useState<string>("");
  const [isCopiedCodUpi, setIsCopiedCodUpi] = useState<boolean>(false);
  const [codQrCropMode, setCodQrCropMode] = useState<"cropped" | "full" | "dynamic">("cropped");
  const [isDownloadingCodQr, setIsDownloadingCodQr] = useState<boolean>(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreviewResponse | null>(null);

  // Delivery Timing Preference State
  const [hasCustomCake, setHasCustomCake] = useState<boolean>(false);
  const [isInstantOrder, setIsInstantOrder] = useState<boolean>(false);
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

  // Multi-step checkout state (1: Delivery & Address, 2: Delivery Timing, 3: Review & Payment)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isItemsExpanded, setIsItemsExpanded] = useState<boolean>(false);

  const basePayableAmount = checkoutPreview?.pricing
    ? Math.round(checkoutPreview.pricing.totalAmount)
    : 0;
  const potentialSavings = Math.round(basePayableAmount * 0.015);
  const manualUpiDiscount = paymentMethod === "MANUAL_UPI" ? potentialSavings : 0;
  const payableAmount = Math.max(0, basePayableAmount - manualUpiDiscount);
  const codAdvanceAmount = Math.ceil(basePayableAmount * 0.5);
  const codRemainingAmount = Math.max(0, basePayableAmount - codAdvanceAmount);
  const minDelivery = checkoutPreview?.deliveryThreshold?.minDeliveryAmount ?? 0;
  const subtotal = checkoutPreview?.pricing?.subtotal || 0;
  const isBelowMin = fulfillmentType === "HOME_DELIVERY" && minDelivery > 0 && subtotal < minDelivery;
  const remainingForMin = Math.max(0, minDelivery - subtotal);

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

      // Check if order is eligible for "⚡ Ready to Deliver (Instant)":
      // If yes: specific date/time is hidden and instant is active.
      // If no (made to order / custom cake / advance prep): instant is hidden and date/time slot is required.
      const instantOrderFlag = directItem
        ? Boolean((directItem as any).isInstantAvailable) && !isCustomCake
        : (currentCart.items || []).length > 0 &&
          (currentCart.items || []).every(
            (i) => Boolean(i.productId?.isInstantAvailable)
          ) &&
          !isCustomCake;
      setIsInstantOrder(instantOrderFlag);

      if (instantOrderFlag) {
        setTimingType("INSTANT");
      } else {
        setTimingType("SCHEDULED");
        const targetDate = new Date();
        if (isCustomCake) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        setScheduledDate(targetDate.toISOString().split("T")[0]);
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
    adminOperationsService
      .getSettings()
      .then((res) => {
        if (res?.upiId) {
          setBakeryUpiId(res.upiId);
        }
        if (res?.upiQr) {
          setBakeryUpiQr(res.upiQr);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File Type", "Please upload a valid receipt image (JPG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const maxWidth = 1000;
        const maxHeight = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setPaymentReceiptPreview(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          setPaymentReceiptPreview(src);
        }
        toast.success("Receipt Uploaded", "Payment receipt screenshot attached successfully.");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleCopyUpiId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bakeryUpiId);
      setIsCopiedUpi(true);
      toast.success("UPI ID Copied!", `${bakeryUpiId} copied to clipboard.`);
      setTimeout(() => setIsCopiedUpi(false), 2500);
    }
  };

  const handleDownloadQr = async () => {
    setIsDownloadingQr(true);
    const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
      buildUpiUri(bakeryUpiId, payableAmount)
    )}`;
    const qrDisplayUrl = qrCropMode === "full" && bakeryUpiQr ? bakeryUpiQr : dynamicQrUrl;

    try {
      if (qrDisplayUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = qrDisplayUrl;
        link.download = `onebite-bakery-upi-qr-${payableAmount}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(
          "QR Code Downloaded!",
          "Open PhonePe / Paytm / GPay -> Scan QR from Gallery to pay."
        );
        return;
      }

      const response = await fetch(qrDisplayUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `onebite-bakery-upi-qr-${payableAmount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(
        "QR Code Downloaded!",
        "Open PhonePe / Paytm / GPay -> Scan QR from Gallery to pay."
      );
    } catch (_err) {
      window.open(qrDisplayUrl, "_blank");
      toast.info(
        "QR Code Opened",
        "Long-press or right-click the image to save it to your phone."
      );
    } finally {
      setIsDownloadingQr(false);
    }
  };

  const handleCopyCodUpiId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bakeryUpiId);
      setIsCopiedCodUpi(true);
      toast.success("UPI ID Copied!", `${bakeryUpiId} copied to clipboard.`);
      setTimeout(() => setIsCopiedCodUpi(false), 2500);
    }
  };

  const handleDownloadCodQr = async () => {
    setIsDownloadingCodQr(true);
    const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
      buildUpiUri(bakeryUpiId, codAdvanceAmount)
    )}`;
    const qrDisplayUrl = codQrCropMode === "full" && bakeryUpiQr ? bakeryUpiQr : dynamicQrUrl;

    try {
      if (qrDisplayUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = qrDisplayUrl;
        link.download = `onebite-bakery-cod-advance-qr-${codAdvanceAmount}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(
          "QR Code Downloaded!",
          "Open PhonePe / Paytm / GPay -> Scan QR from Gallery to pay 50% advance."
        );
        return;
      }

      const response = await fetch(qrDisplayUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `onebite-bakery-cod-advance-qr-${codAdvanceAmount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(
        "QR Code Downloaded!",
        "Open PhonePe / Paytm / GPay -> Scan QR from Gallery to pay 50% advance."
      );
    } catch (_err) {
      window.open(qrDisplayUrl, "_blank");
      toast.info(
        "QR Code Opened",
        "Long-press or right-click the image to save it to your phone."
      );
    } finally {
      setIsDownloadingCodQr(false);
    }
  };

  const handleCodReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File Type", "Please upload a valid receipt image (JPG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const maxWidth = 1000;
        const maxHeight = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setCodReceiptPreview(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          setCodReceiptPreview(src);
        }
        toast.success("50% Advance Receipt Uploaded", "Payment receipt screenshot attached successfully.");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
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

  const selectedAddr = addresses.find((address) => address.id === selectedAddressId);

  const validateStep1 = (): boolean => {
    setErrorMsg(null);
    if (fulfillmentType === "HOME_DELIVERY") {
      if (
        checkoutPreview?.deliveryThreshold &&
        !checkoutPreview.deliveryThreshold.isEligibleForDelivery
      ) {
        const min = checkoutPreview.deliveryThreshold.minDeliveryAmount;
        const subtotal = checkoutPreview?.pricing?.subtotal || 0;
        const remaining = Math.max(0, min - subtotal);
        const msg = `Home Delivery ke liye minimum order ₹${min} hona zaroori hai. Cart me ₹${remaining} aur jodein ya Store Pickup chunein.`;
        setErrorMsg(msg);
        toast.error("Minimum Order Not Met", msg);
        return false;
      }

      if (!selectedAddressId) {
        if (addresses.length === 0) {
          setIsAddAddressModalOpen(true);
          return false;
        }
        setErrorMsg("Please select a delivery address for Home Delivery.");
        toast.error("Address Required", "Please select a delivery address.");
        return false;
      }
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setErrorMsg(null);
    const effectiveTimingType = isInstantOrder ? "INSTANT" : "SCHEDULED";
    if (effectiveTimingType === "SCHEDULED" && !scheduledDate) {
      setErrorMsg("Please select a delivery date.");
      toast.error("Date Required", "Please select a delivery date.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (currentStep === 3) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 2) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToStep = (step: 1 | 2 | 3) => {
    if (step === currentStep) return;
    if (step < currentStep) {
      setCurrentStep(step);
      setErrorMsg(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step === 2) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (step === 3) {
      if (validateStep1() && validateStep2()) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMsg(null);
    setPaymentStateMessage(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMsg("You are currently offline. Please connect to the internet to place your order.");
      toast.error("Offline", "An active internet connection is required to complete checkout.");
      return;
    }

    if (
      fulfillmentType === "HOME_DELIVERY" &&
      checkoutPreview?.deliveryThreshold &&
      !checkoutPreview.deliveryThreshold.isEligibleForDelivery
    ) {
      const min = checkoutPreview.deliveryThreshold.minDeliveryAmount;
      const subtotal = checkoutPreview.pricing?.subtotal || 0;
      const remaining = Math.max(0, min - subtotal);
      const msg = `Home Delivery ke liye minimum order ₹${min} hona zaroori hai. Cart me ₹${remaining} aur jodein ya Store Pickup chunein.`;
      setErrorMsg(msg);
      toast.error("Minimum Order Not Met", msg);
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

    const effectiveTimingType = isInstantOrder ? "INSTANT" : "SCHEDULED";
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
      deliveryPreference = "⚡ Ready to Deliver (Instant - Within 30-45 mins)";
    }

    try {
      setIsPlacingOrder(true);

      if (paymentMethod === "MANUAL_UPI") {
        if (!paymentReceiptPreview && !transactionId.trim()) {
          setManualUpiStep(2);
          setErrorMsg(
            t(
              "checkout.receiptRequiredAlert",
              "कृपया पेमेंट का स्क्रीनशॉट अपलोड करें या 12 अंकों का UTR नंबर दर्ज करें। (Please upload payment receipt screenshot or enter 12-digit UTR number.)"
            )
          );
          toast.error(
            "रसीद या UTR आवश्यक है / Receipt Required",
            "Payment screenshot ya 12-digit UTR number submit karna zaroori hai."
          );
          setIsPlacingOrder(false);
          return;
        }

        setPaymentStateMessage("Submitting your order with payment receipt...");
        const order = await checkoutService.createOrder({
          fulfillmentType,
          paymentMethod: "MANUAL_UPI",
          addressId: selectedAddressId,
          deliveryTimingType: effectiveTimingType,
          deliveryTimePreference: deliveryPreference,
          scheduledDate: effectiveTimingType === "SCHEDULED" ? scheduledDate : undefined,
          scheduledTimeSlot: effectiveTimingType === "SCHEDULED" ? scheduledTimeSlot : undefined,
          paymentReceiptUrl: paymentReceiptPreview || undefined,
          transactionId: transactionId.trim() || undefined,
          directItem,
        });

        const manualOrder: OrderDetails = {
          id: order.id,
          orderNumber: order.orderNumber,
          orderStatus: (order.orderStatus as OrderDetails["orderStatus"]) || "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "MANUAL_UPI",
          paymentReceiptUrl: paymentReceiptPreview || undefined,
          transactionId: transactionId.trim() || undefined,
          manualUpiDiscount,
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
          discountAmount: (checkoutPreview?.pricing.discountAmount || 0) + manualUpiDiscount,
          totalAmount: order.totalAmount || payableAmount,
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

        orderService.addOrder(manualOrder);
        setPlacedOrder(manualOrder);
        setIsCelebrationModalOpen(true);
        toast.success("Order Placed Successfully! 🎉", `Order #${manualOrder.orderNumber} placed via Direct UPI (Saved ₹${manualUpiDiscount}). Receipt submitted!`);
        setIsPlacingOrder(false);
        setPaymentStateMessage(null);
        return;
      }

      if (paymentMethod === "COD") {
        if (!codReceiptPreview && !codTransactionId.trim()) {
          setCodStep(2);
          const errorText = t(
            "checkout.codAdvanceRequiredAlert",
            `COD ऑर्डर के लिए 50% अग्रिम भुगतान (₹${codAdvanceAmount}) का स्क्रीनशॉट या 12 अंकों का UTR नंबर जमा करना अनिवार्य है। जब तक यह नहीं होगा, ऑर्डर प्लेस नहीं किया जा सकता। (Please upload receipt screenshot or enter 12-digit UTR number for the 50% COD advance payment.)`
          );
          setErrorMsg(errorText);
          toast.error(
            "50% अग्रिम भुगतान आवश्यक / Advance Required",
            `COD ऑर्डर प्लेस करने के लिए ₹${codAdvanceAmount} का पेमेंट स्क्रीनशॉट या UTR नंबर दर्ज करें।`
          );
          setIsPlacingOrder(false);
          return;
        }

        setPaymentStateMessage("Creating your order (Cash on Delivery with 50% Advance)...");
        const order = await checkoutService.createOrder({
          fulfillmentType,
          paymentMethod: "COD",
          addressId: selectedAddressId,
          deliveryTimingType: effectiveTimingType,
          deliveryTimePreference: deliveryPreference,
          scheduledDate: effectiveTimingType === "SCHEDULED" ? scheduledDate : undefined,
          scheduledTimeSlot: effectiveTimingType === "SCHEDULED" ? scheduledTimeSlot : undefined,
          paymentReceiptUrl: codReceiptPreview || undefined,
          transactionId: codTransactionId.trim() || undefined,
          customerNotes: `COD Order: 50% Advance (₹${codAdvanceAmount}) paid via UPI (UTR: ${codTransactionId.trim() || "Receipt Attached"}). Remaining Balance: ₹${codRemainingAmount} to be paid in cash on delivery.`,
          directItem,
        });

        const codOrder: OrderDetails = {
          id: order.id,
          orderNumber: order.orderNumber,
          orderStatus: (order.orderStatus as OrderDetails["orderStatus"]) || "PENDING",
          paymentStatus: (order.paymentStatus as OrderDetails["paymentStatus"]) || "PENDING",
          paymentMethod: "COD",
          paymentReceiptUrl: codReceiptPreview || undefined,
          transactionId: codTransactionId.trim() || undefined,
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
        toast.success("Order Placed Successfully! 🎉", `Order #${codOrder.orderNumber} placed via Cash on Delivery with 50% Advance (₹${codAdvanceAmount}) submitted!`);
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
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2 text-left">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <Banknote className="h-4 w-4 text-amber-700" />
                <span>Cash on Delivery Notice (50% Advance Submitted)</span>
              </p>
              <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 space-y-1">
                <div className="flex justify-between">
                  <span>50% Advance Paid (via UPI):</span>
                  <strong className="text-emerald-700">₹{Math.ceil(placedOrder.totalAmount * 0.5)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Cash Due on Delivery:</span>
                  <strong className="text-amber-950">₹{Math.max(0, placedOrder.totalAmount - Math.ceil(placedOrder.totalAmount * 0.5))}</strong>
                </div>
                {placedOrder.transactionId && (
                  <div className="flex justify-between text-[11px] text-gray-500 pt-0.5 border-t border-gray-100 font-mono">
                    <span>Advance UTR Ref:</span>
                    <span className="font-bold text-[#3B302B]">{placedOrder.transactionId}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px]">
                Please keep remaining <strong>₹{Math.max(0, placedOrder.totalAmount - Math.ceil(placedOrder.totalAmount * 0.5))}</strong> exact cash ready when delivery agent arrives or when picking up at store.
              </p>
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
    <div className="space-y-6 pb-28 sm:pb-16 max-w-5xl mx-auto">
      {/* Top Bar: Return to Cart & Direct Checkout badge */}
      <div className="flex items-center justify-between">
        <Link
          to="/cart"
          onClick={() => {
            sessionStorage.removeItem("onebitebakery_direct_order_item");
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Cart</span>
        </Link>

        {directItem ? (
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <Zap className="h-3.5 w-3.5 text-[#596B58] fill-current" />
            <span>Instant Single-Item Checkout</span>
          </span>
        ) : null}
      </div>

      {directItem ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
          <div className="flex items-center gap-3.5 text-amber-900">
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
                {t(
                  "checkout.safeInCart",
                  "Items already in your cart remain completely safe and untouched in your cart."
                )}
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
            {t("checkout.checkoutFullCartInstead", "Checkout Full Cart Instead")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">
          {directItem
            ? t("checkout.directOrderCheckout", "Direct Order Checkout")
            : t("checkout.checkoutAndReview", "Checkout & Order Review")}
        </h1>
        <span className="text-xs font-bold text-[#596B58] bg-[#FFF8EC] border border-[#596B58]/20 px-3 py-1 rounded-full w-fit">
          {t("checkout.stepCount", {
            current: currentStep,
            total: 3,
            stepName:
              currentStep === 1
                ? t("checkout.stepDeliveryAddress", "Delivery Method & Address")
                : currentStep === 2
                ? t("checkout.stepDeliveryTiming", "Delivery Timing")
                : t("checkout.stepReviewPayment", "Review & Payment"),
            defaultValue: `Step ${currentStep} of 3: ${
              currentStep === 1
                ? "Delivery Method & Address"
                : currentStep === 2
                ? "Delivery Timing"
                : "Review & Payment"
            }`,
          })}
        </span>
      </div>

      {/* Multi-Step Checkout Navigation Bar */}
      <div className="bg-white rounded-2xl border border-[#E5DEC9] p-2 sm:p-3 shadow-2xs">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => goToStep(1)}
            className={`flex items-center justify-center sm:justify-start gap-2 p-2 sm:p-3 rounded-xl transition-all cursor-pointer text-left ${
              currentStep === 1
                ? "bg-[#596B58] text-white shadow-xs font-bold ring-2 ring-[#596B58]/30"
                : currentStep > 1
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent"
            }`}
          >
            <div
              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 1
                  ? "bg-white text-[#596B58]"
                  : currentStep > 1
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > 1 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "1"}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-bold leading-tight truncate">{t("checkout.step1Pill", "1. Delivery Mode")}</p>
              <p className={`text-[10px] truncate ${currentStep === 1 ? "text-emerald-100" : "text-[#7A6E65]"}`}>
                {fulfillmentType === "HOME_DELIVERY" ? t("checkout.homeDelivery", "Home Delivery") : t("checkout.storePickup", "Store Pickup")}
              </p>
            </div>
            <span className="sm:hidden text-xs font-bold truncate">{t("checkout.step1Mobile", "1. Delivery")}</span>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => goToStep(2)}
            className={`flex items-center justify-center sm:justify-start gap-2 p-2 sm:p-3 rounded-xl transition-all cursor-pointer text-left ${
              currentStep === 2
                ? "bg-[#596B58] text-white shadow-xs font-bold ring-2 ring-[#596B58]/30"
                : currentStep > 2
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent"
            }`}
          >
            <div
              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 2
                  ? "bg-white text-[#596B58]"
                  : currentStep > 2
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > 2 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "2"}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-bold leading-tight truncate">{t("checkout.step2Pill", "2. Delivery Timing")}</p>
              <p className={`text-[10px] truncate ${currentStep === 2 ? "text-emerald-100" : "text-[#7A6E65]"}`}>
                {isInstantOrder ? t("checkout.instantAsap", "⚡ Instant (30-45m)") : t("checkout.scheduled", "📅 Scheduled Slot")}
              </p>
            </div>
            <span className="sm:hidden text-xs font-bold truncate">{t("checkout.step2Mobile", "2. Timing")}</span>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => goToStep(3)}
            className={`flex items-center justify-center sm:justify-start gap-2 p-2 sm:p-3 rounded-xl transition-all cursor-pointer text-left ${
              currentStep === 3
                ? "bg-[#596B58] text-white shadow-xs font-bold ring-2 ring-[#596B58]/30"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent"
            }`}
          >
            <div
              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep === 3
                  ? "bg-white text-[#596B58]"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-bold leading-tight truncate">{t("checkout.step3Pill", "3. Review & Pay")}</p>
              <p className={`text-[10px] truncate ${currentStep === 3 ? "text-emerald-100" : "text-[#7A6E65]"}`}>
                {paymentMethod === "UPI"
                  ? "Razorpay"
                  : paymentMethod === "MANUAL_UPI"
                  ? t("checkout.manualUpi", "⚡ Direct UPI")
                  : t("checkout.cashOnDelivery", "Cash on Delivery")}
              </p>
            </div>
            <span className="sm:hidden text-xs font-bold truncate">{t("checkout.step3Mobile", "3. Payment")}</span>
          </button>
        </div>
      </div>

      {errorMsg ? (
        <div className="p-4 bg-amber-50 text-amber-900 text-xs font-semibold rounded-xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <span>{errorMsg}</span>
          {errorMsg.toLowerCase().includes("home delivery") ? (
            <button
              type="button"
              onClick={() => {
                setFulfillmentType("STORE_PICKUP");
                setErrorMsg(null);
              }}
              className="px-3 py-1.5 bg-[#596B58] hover:bg-[#495948] text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
            >
              {t("checkout.switchToStorePickup", "Switch to Store Pickup")}
            </button>
          ) : null}
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
          <h2 className="text-xl font-extrabold text-[#3B302B]">{t("checkout.checkoutEmptyTitle", "Your Checkout is Empty")}</h2>
          <p className="text-xs text-[#7A6E65] max-w-md mx-auto">
            {t("checkout.checkoutEmptyDesc", "You don't have any items ready for checkout. Browse our fresh artisanal cakes, combos, and treats to place an order!")}
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/products"
              className="px-6 py-2.5 rounded-xl bg-[#596B58] hover:bg-[#495948] text-white text-xs font-bold transition-all shadow-sm"
            >
              {t("checkout.exploreMenu", "Explore Bakery Menu")}
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 rounded-xl bg-white border border-[#E5DEC9] hover:bg-[#FFF8EC] text-[#3B302B] text-xs font-bold transition-all"
            >
              {t("checkout.goToHome", "Go to Home Page")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Active Step Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: Delivery Mode & Address */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
                    <h3 className="text-lg font-bold text-[#3B302B] flex items-center gap-2">
                      <Truck className="h-5 w-5 text-[#596B58]" />
                      <span>{t("checkout.step1Title", "1. Choose Delivery Method")}</span>
                    </h3>
                    <span className="text-xs font-semibold text-[#7A6E65]">{t("checkout.step1of3", "Step 1 of 3")}</span>
                  </div>

                  <DeliverySelector
                    fulfillmentType={fulfillmentType}
                    onChange={setFulfillmentType}
                    homeDeliveryEligible={checkoutPreview?.deliveryThreshold?.isEligibleForDelivery}
                    minimumHomeDeliveryAmount={checkoutPreview?.deliveryThreshold?.minDeliveryAmount}
                    subtotal={checkoutPreview?.pricing?.subtotal}
                  />
                </Card>

                {fulfillmentType === "HOME_DELIVERY" ? (
                  <Card className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#3B302B]">{t("checkout.selectDeliveryAddress", "Select Delivery Address")}</h3>
                        <p className="text-xs text-[#7A6E65]">{t("checkout.deliveryAddressSub", "Where should we deliver your freshly baked items?")}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setIsAddAddressModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        <span>{t("checkout.addNewAddress", "Add Address")}</span>
                      </Button>
                    </div>

                    {addresses.length > 0 ? (
                      <AddressSelector
                        addresses={addresses}
                        selectedAddressId={selectedAddressId}
                        onSelect={(id) => {
                          setSelectedAddressId(id);
                          setErrorMsg(null);
                          const addr = addresses.find((a) => a.id === id);
                          if (addr) {
                            const matched = villages.find(
                              (v) =>
                                (addr.village && v.name.toLowerCase() === addr.village.toLowerCase()) ||
                                (addr.city && v.name.toLowerCase() === addr.city.toLowerCase()),
                            );
                            if (matched) {
                              void updateCurrentLocation(matched.id, matched.district);
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="p-6 bg-[#FFF8EC] rounded-2xl border-2 border-dashed border-[#E5DEC9] text-center space-y-3">
                        <p className="text-xs text-[#7A6E65]">{t("checkout.noAddressFound", "No delivery address found for home delivery.")}</p>
                        <Button size="sm" onClick={() => setIsAddAddressModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-1.5" />
                          <span>{t("checkout.createDeliveryAddressNow", "Create Delivery Address Now")}</span>
                        </Button>
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card className="space-y-4">
                    <div className="border-b border-[#E5DEC9] pb-3">
                      <h3 className="text-lg font-bold text-[#3B302B]">{t("checkout.storePickupCounterDirections", "Store Pickup Counter & Map Directions")}</h3>
                      <p className="text-xs text-[#7A6E65]">{t("checkout.storePickupSub", "Pick up fresh from our bakery counter with zero delivery fee!")}</p>
                    </div>
                    <StorePickupLocationCard />
                  </Card>
                )}

                {/* Step 1 Actions */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  {isBelowMin ? (
                    <Button
                      onClick={handleNextStep}
                      className="w-full sm:w-auto px-6 h-12 shadow-md bg-amber-600 hover:bg-amber-700"
                    >
                      <span>{t("checkout.addMoreForHomeDelivery", { amount: remainingForMin, defaultValue: `Add ₹${remainingForMin} More for Home Delivery` })}</span>
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextStep}
                      className="w-full sm:w-auto px-6 h-12 shadow-md"
                    >
                      <span>{t("checkout.continueToDeliveryTiming", "Continue to Delivery Timing")}</span>
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Delivery Timing */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Step 1 Summary Pill */}
                <div className="p-3.5 bg-white rounded-2xl border border-[#E5DEC9] flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5 text-[#3B302B] min-w-0">
                    <Truck className="h-4 w-4 text-[#596B58] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">
                        {fulfillmentType === "HOME_DELIVERY" ? t("checkout.homeDeliveryTo", "Home Delivery to:") : t("checkout.storePickupColon", "Store Pickup:")}
                      </p>
                      <p className="text-[11px] text-[#7A6E65] truncate">
                        {fulfillmentType === "HOME_DELIVERY"
                          ? `${selectedAddr?.name || "Customer"}, ${selectedAddr?.village || selectedAddr?.district || "Address"}`
                          : "Onebite Bakery terha hamirpur main counter"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-xs font-bold text-[#596B58] hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>{t("checkout.change", "Change")}</span>
                  </button>
                </div>

                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#3B302B] flex items-center gap-2">
                        <Clock className="h-5 w-5 text-[#596B58]" />
                        <span>{t("checkout.step2Title", "2. Delivery Timing Preference")}</span>
                      </h3>
                      <p className="text-xs text-[#7A6E65]">{t("checkout.selectTimingSub", "Select when you want to receive or pick up your order")}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#7A6E65]">{t("checkout.step2of3", "Step 2 of 3")}</span>
                  </div>

                  <DeliveryTimingSelector
                    hasCustomCake={hasCustomCake}
                    isInstantOrder={isInstantOrder}
                    timingType={timingType}
                    onTimingTypeChange={setTimingType}
                    scheduledDate={scheduledDate}
                    onDateChange={setScheduledDate}
                    scheduledTimeSlot={scheduledTimeSlot}
                    onTimeSlotChange={setScheduledTimeSlot}
                  />
                </Card>

                {/* Step 2 Actions */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-5 h-12 border-[#E5DEC9]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    <span>{t("checkout.backToDelivery", "Back to Delivery")}</span>
                  </Button>

                  <Button
                    onClick={handleNextStep}
                    className="px-6 h-12 shadow-md"
                  >
                    <span>{t("checkout.continueToReviewPayment", "Continue to Review & Payment")}</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Payment */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Summary of Step 1 & Step 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-2xl border border-[#E5DEC9] flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5 text-[#3B302B] min-w-0">
                      <Truck className="h-4 w-4 text-[#596B58] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">
                          {fulfillmentType === "HOME_DELIVERY" ? t("checkout.homeDelivery", "Home Delivery") : t("checkout.storePickup", "Store Pickup")}
                        </p>
                        <p className="text-[11px] text-[#7A6E65] truncate">
                          {fulfillmentType === "HOME_DELIVERY"
                            ? `${selectedAddr?.name || "Customer"}, ${selectedAddr?.village || selectedAddr?.district || ""}`
                            : "Bakery Main Counter"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="text-xs font-bold text-[#596B58] hover:underline shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{t("checkout.edit", "Edit")}</span>
                    </button>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-[#E5DEC9] flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5 text-[#3B302B] min-w-0">
                      <Clock className="h-4 w-4 text-[#596B58] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">
                          {isInstantOrder ? t("checkout.instantReadyTitle", "⚡ Ready to Deliver (Instant)") : t("checkout.specificDateTimeSlot", "📅 Specific Date & Time Slot")}
                        </p>
                        <p className="text-[11px] text-[#7A6E65] truncate">
                          {isInstantOrder
                            ? t("checkout.instantAsapDesc", "Dispatched immediately (Within 30-45 mins)")
                            : `${scheduledDate ? new Date(scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Scheduled"} (${scheduledTimeSlot})`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="text-xs font-bold text-[#596B58] hover:underline shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{t("checkout.edit", "Edit")}</span>
                    </button>
                  </div>
                </div>

                {/* Payment Method Card */}
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#3B302B] flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-[#596B58]" />
                        <span>{t("checkout.step3Title", "3. Choose Payment Method")}</span>
                      </h3>
                      <p className="text-xs text-[#7A6E65]">{t("checkout.selectPaymentSub", "Select your preferred payment method")}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#7A6E65]">{t("checkout.step3of3", "Step 3 of 3")}</span>
                  </div>

                  <div className="space-y-3">
                    {/* Option 1: Razorpay Online */}
                    <div
                      onClick={() => setPaymentMethod("UPI")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                        paymentMethod === "UPI"
                          ? "border-[#596B58] bg-[#FFF8EC]/60 shadow-xs ring-2 ring-[#596B58]/30"
                          : "border-[#E5DEC9] bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentMethod === "UPI"}
                        onChange={() => setPaymentMethod("UPI")}
                        className="mt-1 text-[#596B58] accent-[#596B58]"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-sm text-[#3B302B]">
                          <QrCode className="h-4 w-4 text-[#596B58]" />
                          <span>{t("checkout.razorpayTitle", "Pay with Razorpay (Instant Online)")}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                            {t("checkout.fastAndInstant", "Fast & Instant")}
                          </span>
                        </div>
                        <p className="text-xs text-[#7A6E65]">
                          {t("checkout.razorpayDesc", "Google Pay, PhonePe, Paytm, BHIM, Cards & Netbanking securely through Razorpay gateway.")}
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Direct UPI ID & QR Code (Manual Payment with 1.5% Discount) */}
                    <div
                      onClick={() => setPaymentMethod("MANUAL_UPI")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === "MANUAL_UPI"
                          ? "border-[#596B58] bg-[#FFF8EC]/80 shadow-md ring-2 ring-[#596B58]/30"
                          : "border-[#E5DEC9] bg-white hover:border-[#596B58]/50"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <input
                          type="radio"
                          name="payment-method"
                          checked={paymentMethod === "MANUAL_UPI"}
                          onChange={() => setPaymentMethod("MANUAL_UPI")}
                          className="mt-1 text-[#596B58] accent-[#596B58]"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#3B302B] flex items-center gap-1.5">
                              <QrCode className="h-4 w-4 text-[#596B58]" />
                              <span>{t("checkout.manualUpiTitle", "Direct UPI ID & QR Code (Manual)")}</span>
                            </span>
                            <span className="text-[10px] bg-gradient-to-r from-amber-500 to-red-500 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              <span>{t("checkout.flat15ExtraOff", "🔥 FLAT 1.5% EXTRA OFF")}</span>
                            </span>
                            {potentialSavings > 0 && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                {t("checkout.saveAmount", { amount: potentialSavings, defaultValue: `Save ₹${potentialSavings}` })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#7A6E65]">
                            {t(
                              "checkout.manualUpiDesc",
                              "Pay directly via UPI ID or scan QR code. Flat 1.5% discount automatically deducted from your total bill! Submit payment receipt / UTR after payment."
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Expanded Section when MANUAL_UPI is Selected */}
                      {paymentMethod === "MANUAL_UPI" && (
                        <div className="mt-4 pt-4 border-t border-[#E5DEC9] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Sub-step indicator pills */}
                          <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5DEC9]">
                            <button
                              type="button"
                              onClick={() => setManualUpiStep(1)}
                              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                manualUpiStep === 1
                                  ? "bg-[#596B58] text-white shadow-xs"
                                  : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-white"
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  manualUpiStep === 1 ? "bg-white text-[#596B58]" : "bg-[#E5DEC9] text-[#7A6E65]"
                                }`}
                              >
                                1
                              </span>
                              <span className="truncate">{t("checkout.subStep1Pay", "1. स्कैन व भुगतान")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualUpiStep(2)}
                              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                manualUpiStep === 2
                                  ? "bg-[#596B58] text-white shadow-xs"
                                  : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-white"
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  manualUpiStep === 2 ? "bg-white text-[#596B58]" : "bg-[#E5DEC9] text-[#7A6E65]"
                                }`}
                              >
                                2
                              </span>
                              <span className="truncate">{t("checkout.subStep2Verify", "2. रसीद / UTR")}</span>
                              {(paymentReceiptPreview || transactionId.trim()) && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          </div>

                          {/* SUB-STEP 1: SCAN & PAY */}
                          {manualUpiStep === 1 && (
                            <div className="space-y-3.5 animate-in fade-in duration-200">
                              {/* 1.5% Discount Banner (Rationalized Whole Numbers) */}
                              <div className="p-3 bg-gradient-to-r from-emerald-500/15 via-amber-500/10 to-emerald-500/15 border border-emerald-300 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                                <div className="flex items-center gap-2 text-emerald-950 font-bold">
                                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <div>
                                    <span className="block font-bold">{t("checkout.instantSavingApplied", "1.5% Instant Saving Applied:")}</span>
                                    <span className="text-[10px] text-emerald-800 font-semibold">
                                      {t("checkout.youSaveAmount", { amount: potentialSavings, defaultValue: `आपकी बचत ₹${potentialSavings}` })}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="line-through text-gray-400 text-xs mr-1.5">₹{basePayableAmount}</span>
                                  <span className="font-extrabold text-base text-emerald-700">₹{payableAmount}</span>
                                </div>
                              </div>

                              {/* Focused QR Code Card (Only QR Code visible, no extra poster part) */}
                              <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                                <div className="flex items-center justify-between w-full px-1">
                                  <span className="text-[11px] font-bold text-[#3B302B] uppercase tracking-wider">
                                    {t("checkout.step1ScanPay", "Step 1: Scan QR or Download & Pay")}
                                  </span>
                                  <span className="inline-block text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    {t("checkout.exactAmount", { amount: payableAmount, defaultValue: `राशि: ₹${payableAmount}` })}
                                  </span>
                                </div>

                                {/* QR Viewport: Cropped to show only QR without PhonePe banner/footer */}
                                <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto overflow-hidden rounded-2xl bg-white border-2 border-dashed border-[#596B58]/40 shadow-xs flex items-center justify-center p-1.5">
                                  {qrCropMode === "cropped" && bakeryUpiQr ? (
                                    <img
                                      src={bakeryUpiQr}
                                      alt="Bakery Store QR Code"
                                      className="w-full h-full object-cover object-center scale-[1.75] transform select-none rounded-xl"
                                    />
                                  ) : qrCropMode === "dynamic" ? (
                                    <img
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                        buildUpiUri(bakeryUpiId, payableAmount)
                                      )}`}
                                      alt="Dynamic UPI QR Code"
                                      className="w-full h-full object-contain rounded-lg"
                                    />
                                  ) : (
                                    <img
                                      src={
                                        bakeryUpiQr ||
                                        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                          buildUpiUri(bakeryUpiId, payableAmount)
                                        )}`
                                      }
                                      alt="Bakery UPI QR Code"
                                      className="w-full h-full object-contain rounded-lg"
                                    />
                                  )}
                                </div>

                                {/* QR Mode Toggles */}
                                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5 text-[11px]">
                                  {bakeryUpiQr && (
                                    <button
                                      type="button"
                                      onClick={() => setQrCropMode((prev) => (prev === "cropped" ? "full" : "cropped"))}
                                      className="px-2.5 py-1 rounded-full border border-gray-300 hover:border-[#596B58] text-[#596B58] font-semibold bg-white transition-all shadow-2xs cursor-pointer"
                                    >
                                      {qrCropMode === "cropped" ? `🔍 ${t("checkout.cropQrFull", "पूरा पोस्टर")}` : `✂️ ${t("checkout.cropQrOnly", "केवल QR कोड")}`}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setQrCropMode((prev) => (prev === "dynamic" ? "cropped" : "dynamic"))}
                                    className="px-2.5 py-1 rounded-full border border-gray-300 hover:border-[#596B58] text-[#596B58] font-semibold bg-white transition-all shadow-2xs cursor-pointer"
                                  >
                                    {qrCropMode === "dynamic" ? `🏪 ${t("checkout.officialStoreQr", "स्टोर QR")}` : `⚡ ${t("checkout.dynamicQrBtn", { amount: payableAmount, defaultValue: `सटीक ₹${payableAmount} QR` })}`}
                                  </button>
                                </div>

                                {/* Direct Mobile UPI App Button */}
                                <a
                                  href={buildUpiUri(bakeryUpiId, payableAmount)}
                                  className="w-full py-3 px-4 bg-[#596B58] hover:bg-[#495948] text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
                                >
                                  <Zap className="h-4 w-4 text-amber-300 shrink-0 fill-amber-300" />
                                  <span>{t("checkout.payDirectUpiApp", "🚀 सीधे UPI ऐप से भुगतान करें")}</span>
                                </a>
                                <span className="text-[10px] text-[#7A6E65] -mt-1 block">
                                  {t("checkout.payDirectUpiAppSub", "PhonePe, Google Pay, Paytm, BHIM (राशि पहले से भरी हुई)")}
                                </span>

                                {/* Download QR & Copy UPI Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadQr}
                                    isLoading={isDownloadingQr}
                                    className="w-full text-xs font-bold border-[#596B58] text-[#596B58] hover:bg-[#596B58]/10 flex items-center justify-center gap-1.5 shadow-2xs"
                                  >
                                    <Download className="h-3.5 w-3.5 text-[#596B58]" />
                                    <span>{t("checkout.downloadQrCode", "QR डाउनलोड करें")}</span>
                                  </Button>

                                  <div className="flex items-center justify-between gap-1 p-1.5 bg-[#FFF8EC] border border-[#E5DEC9] rounded-lg">
                                    <span className="text-[11px] font-mono font-bold text-[#3B302B] truncate px-1">{bakeryUpiId}</span>
                                    <button
                                      type="button"
                                      onClick={handleCopyUpiId}
                                      className="px-2 py-1 bg-[#596B58] hover:bg-[#495948] text-white rounded text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                    >
                                      {isCopiedUpi ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                      <span>{isCopiedUpi ? t("checkout.copied", "कॉपी!") : t("checkout.copy", "कॉपी")}</span>
                                    </button>
                                  </div>
                                </div>

                                <p className="text-[10px] text-[#7A6E65] leading-relaxed px-1">
                                  {t(
                                    "checkout.downloadQrTip",
                                    "💡 सुझाव: ऊपर दिए बटन से सीधे UPI ऐप खोलें या QR कोड डाउनलोड करके PhonePe / Paytm / GPay में \"गैलरी से QR स्कैन करें\" (Scan QR from Gallery) से भुगतान करें।"
                                  )}
                                </p>

                                {/* Step 1 Next Button */}
                                <Button
                                  type="button"
                                  onClick={() => setManualUpiStep(2)}
                                  className="w-full h-11 bg-[#596B58] hover:bg-[#495948] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 mt-2"
                                >
                                  <span>{t("checkout.proceedToStep2", "भुगतान पूरा हो गया? रसीद / UTR डालें ➔")}</span>
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* SUB-STEP 2: SUBMIT RECEIPT / UTR */}
                          {manualUpiStep === 2 && (
                            <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] space-y-3.5 shadow-xs animate-in fade-in duration-200">
                              <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                                <span className="font-bold text-[#3B302B]">
                                  {t("checkout.amountToPay", "भुगतान राशि:")}{" "}
                                  <span className="text-emerald-700 font-extrabold text-sm">₹{payableAmount}</span>
                                </span>
                                <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                                  {t("checkout.flat15ExtraOff", "🔥 1.5% छूट लागू")}
                                </span>
                              </div>

                              <div>
                                <span className="text-xs font-bold text-[#3B302B] uppercase tracking-wider block">
                                  {t("checkout.step2SubmitReceipt", "स्टेप 2: भुगतान की रसीद जमा करें *")}
                                </span>
                                <p className="text-[11px] text-[#7A6E65] mt-0.5">
                                  {t(
                                    "checkout.submitReceiptSub",
                                    "भुगतान करने के बाद अपने पेमेंट का स्क्रीनशॉट या ट्रांजैक्शन यूटीआर (UTR) नंबर अपलोड करें।"
                                  )}
                                </p>
                              </div>

                              {/* Upload Screenshot Box */}
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#3B302B] block">
                                  {t("checkout.paymentScreenshotLabel", "पेमेंट स्क्रीनशॉट / रसीद की फोटो *")}
                                </label>
                                {paymentReceiptPreview ? (
                                  <div className="relative p-2.5 bg-[#FFF8EC] rounded-xl border border-[#596B58]/30 flex items-center gap-3">
                                    <img
                                      src={paymentReceiptPreview}
                                      alt="Payment receipt preview"
                                      className="h-16 w-16 rounded-lg object-cover border border-[#E5DEC9]"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-bold text-[#3B302B] block truncate flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        <span>{t("checkout.receiptAttached", "रसीद संलग्न है")}</span>
                                      </span>
                                      <span className="text-[10px] text-[#7A6E65]">
                                        {t("checkout.readyToPlaceOrder", "ऑर्डर देने के लिए तैयार")}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setPaymentReceiptPreview(null)}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title={t("checkout.removeReceipt", "रसीद हटाएं")}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E5DEC9] hover:border-[#596B58] rounded-xl cursor-pointer bg-[#FAF8F5] hover:bg-[#FFF8EC] transition-all">
                                    <UploadCloud className="h-6 w-6 text-[#596B58] mb-1" />
                                    <span className="text-xs font-bold text-[#3B302B]">
                                      {t("checkout.clickToUploadScreenshot", "स्क्रीनशॉट अपलोड करने के लिए क्लिक करें")}
                                    </span>
                                    <span className="text-[10px] text-[#7A6E65]">
                                      {t("checkout.uploadFileSizeNotice", "PNG, JPG, JPEG अधिकतम 10MB")}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleReceiptFileChange}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>

                              {/* Divider */}
                              <div className="flex items-center gap-2 py-1">
                                <div className="h-px bg-[#E5DEC9] flex-1" />
                                <span className="text-[10px] font-bold text-[#7A6E65] uppercase px-1">
                                  {t("checkout.orChoose", "या / OR")}
                                </span>
                                <div className="h-px bg-[#E5DEC9] flex-1" />
                              </div>

                              {/* UTR / Transaction ID */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#3B302B] block">
                                  {t("checkout.upiUtrLabel", "यूपीआई रेफरेंस / यूटीआर नंबर (12 अंक)")}
                                </label>
                                <input
                                  type="text"
                                  placeholder={t("checkout.utrPlaceholder", "उदा. 4235XXXXXXXX")}
                                  value={transactionId}
                                  onChange={(e) => setTransactionId(e.target.value)}
                                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5DEC9] bg-white outline-none focus:border-[#596B58]"
                                />
                                <span className="text-[10px] text-[#7A6E65] block">
                                  {t("checkout.utrHintHindi", "PhonePe / Google Pay / Paytm की रसीद में 12 अंकों का UTR नंबर मिलता है।")}
                                </span>
                              </div>

                              {/* Step 2 Back & Confirm Buttons */}
                              <div className="flex items-center gap-2 pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setManualUpiStep(1)}
                                  className="flex-1 h-11 text-xs font-bold border-[#E5DEC9]"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                                  <span>{t("checkout.backToStep1", "वापस QR देखें")}</span>
                                </Button>

                                <Button
                                  type="button"
                                  onClick={handlePlaceOrder}
                                  isLoading={isPlacingOrder}
                                  className="flex-1 h-11 bg-[#596B58] hover:bg-[#495948] text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                  <Lock className="h-3.5 w-3.5 mr-1" />
                                  <span>{t("checkout.confirmOrderWithAmount", { amount: payableAmount, defaultValue: `ऑर्डर कन्फर्म करें (₹${payableAmount})` })}</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Option 3: Cash on Delivery (50% Advance Required via UPI) */}
                    <div
                      onClick={() => setPaymentMethod("COD")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === "COD"
                          ? "border-[#596B58] bg-[#FFF8EC]/60 shadow-xs ring-2 ring-[#596B58]/30"
                          : "border-[#E5DEC9] bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <input
                          type="radio"
                          name="payment-method"
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                          className="mt-1 text-[#596B58] accent-[#596B58]"
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 font-bold text-sm text-[#3B302B] flex-wrap">
                            <Banknote className="h-4 w-4 text-[#27AE60]" />
                            <span>{t("checkout.cashOnDelivery", "Cash on Delivery (COD)")}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                              {t("checkout.codBadge", "50% Advance via UPI + 50% Cash")}
                            </span>
                          </div>
                          <p className="text-xs text-[#7A6E65]">
                            {t("checkout.codDescNew", "50% अग्रिम भुगतान UPI से करें और शेष 50% डिलीवरी पर नकद दें।")}
                          </p>
                        </div>
                      </div>

                      {/* Expandable 50% Advance Payment Flow */}
                      {paymentMethod === "COD" && (
                        <div
                          className="mt-3.5 pt-3.5 border-t border-[#E5DEC9] space-y-3 cursor-default"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Notice Banner */}
                          <div className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 rounded-xl space-y-2 shadow-2xs">
                            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                              <span>{t("checkout.codAdvanceBanner", "कैश ऑन डिलीवरी के लिए 50% अग्रिम भुगतान आवश्यक")}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white/90 p-2 rounded-lg border border-amber-200">
                                <span className="text-[10px] text-amber-800 font-semibold block">अभी देय (50% UPI):</span>
                                <span className="text-sm font-extrabold text-emerald-700">₹{codAdvanceAmount}</span>
                              </div>
                              <div className="bg-white/90 p-2 rounded-lg border border-amber-200">
                                <span className="text-[10px] text-amber-800 font-semibold block">डिलीवरी पर नकद (50%):</span>
                                <span className="text-sm font-extrabold text-amber-950">₹{codRemainingAmount}</span>
                              </div>
                            </div>
                            <p className="text-[10.5px] text-amber-900 leading-relaxed">
                              ⚠️ <strong>शर्त:</strong> जब तक 50% (₹{codAdvanceAmount}) का भुगतान UPI द्वारा करके रसीद/स्क्रीनशॉट या 12 अंकों का UTR नंबर जमा नहीं किया जाएगा, तब तक ऑर्डर प्लेस नहीं होगा।
                            </p>
                          </div>

                          {/* Sub-step Navigation Pill */}
                          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5EFE6] rounded-xl border border-[#E5DEC9]">
                            <button
                              type="button"
                              onClick={() => setCodStep(1)}
                              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                codStep === 1
                                  ? "bg-[#596B58] text-white shadow-xs"
                                  : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-white"
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  codStep === 1 ? "bg-white text-[#596B58]" : "bg-[#E5DEC9] text-[#7A6E65]"
                                }`}
                              >
                                1
                              </span>
                              <span className="truncate">1. स्कैन व ₹{codAdvanceAmount} भुगतान</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCodStep(2)}
                              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                codStep === 2
                                  ? "bg-[#596B58] text-white shadow-xs"
                                  : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-white"
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  codStep === 2 ? "bg-white text-[#596B58]" : "bg-[#E5DEC9] text-[#7A6E65]"
                                }`}
                              >
                                2
                              </span>
                              <span className="truncate">2. रसीद / UTR</span>
                              {(codReceiptPreview || codTransactionId.trim()) && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          </div>

                          {/* SUB-STEP 1: SCAN & PAY ₹{codAdvanceAmount} */}
                          {codStep === 1 && (
                            <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] flex flex-col items-center justify-center text-center space-y-3 shadow-xs animate-in fade-in duration-200">
                              <div className="flex items-center justify-between w-full px-1">
                                <span className="text-[11px] font-bold text-[#3B302B] uppercase tracking-wider">
                                  STEP 1: SCAN QR OR DOWNLOAD & PAY
                                </span>
                                <span className="inline-block text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Exact ₹{codAdvanceAmount}
                                </span>
                              </div>

                              {/* QR Viewport */}
                              <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto overflow-hidden rounded-2xl bg-white border-2 border-dashed border-[#596B58]/40 shadow-xs flex items-center justify-center p-1.5">
                                {codQrCropMode === "cropped" && bakeryUpiQr ? (
                                  <img
                                    src={bakeryUpiQr}
                                    alt="Bakery Store QR Code"
                                    className="w-full h-full object-cover object-center scale-[1.75] transform select-none rounded-xl"
                                  />
                                ) : codQrCropMode === "dynamic" ? (
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                      buildUpiUri(bakeryUpiId, codAdvanceAmount)
                                    )}`}
                                    alt="Dynamic UPI QR Code"
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                ) : (
                                  <img
                                    src={
                                      bakeryUpiQr ||
                                      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                        buildUpiUri(bakeryUpiId, codAdvanceAmount)
                                      )}`
                                    }
                                    alt="Bakery UPI QR Code"
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                )}
                              </div>

                              {/* QR Mode Toggles */}
                              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5 text-[11px]">
                                {bakeryUpiQr && (
                                  <button
                                    type="button"
                                    onClick={() => setCodQrCropMode((prev) => (prev === "cropped" ? "full" : "cropped"))}
                                    className="px-2.5 py-1 rounded-full border border-gray-300 hover:border-[#596B58] text-[#596B58] font-semibold bg-white transition-all shadow-2xs cursor-pointer"
                                  >
                                    {codQrCropMode === "cropped" ? "🔍 पूरा पोस्टर" : "✂️ केवल QR कोड"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setCodQrCropMode((prev) => (prev === "dynamic" ? "cropped" : "dynamic"))}
                                  className="px-2.5 py-1 rounded-full border border-gray-300 hover:border-[#596B58] text-[#596B58] font-semibold bg-white transition-all shadow-2xs cursor-pointer"
                                >
                                  {codQrCropMode === "dynamic" ? "🏪 स्टोर QR" : `⚡ सटीक ₹${codAdvanceAmount} QR`}
                                </button>
                              </div>

                              {/* Direct UPI App Button */}
                              <a
                                href={buildUpiUri(bakeryUpiId, codAdvanceAmount)}
                                className="w-full py-3 px-4 bg-[#596B58] hover:bg-[#495948] text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
                              >
                                <Zap className="h-4 w-4 text-amber-300 shrink-0 fill-amber-300" />
                                <span>⚡ सीधे UPI ऐप से ₹{codAdvanceAmount} भुगतान करें</span>
                              </a>
                              <span className="text-[10px] text-[#7A6E65] -mt-1 block">
                                PhonePe, Google Pay, Paytm, BHIM (राशि ₹{codAdvanceAmount} पहले से भरी हुई)
                              </span>

                              {/* Download QR & Copy UPI Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleDownloadCodQr}
                                  isLoading={isDownloadingCodQr}
                                  className="w-full text-xs font-bold border-[#596B58] text-[#596B58] hover:bg-[#596B58]/10 flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                  <Download className="h-3.5 w-3.5 text-[#596B58]" />
                                  <span>QR कोड डाउनलोड करें</span>
                                </Button>

                                <div className="flex items-center justify-between gap-1 p-1.5 bg-[#FFF8EC] border border-[#E5DEC9] rounded-lg">
                                  <span className="text-[11px] font-mono font-bold text-[#3B302B] truncate px-1">{bakeryUpiId}</span>
                                  <button
                                    type="button"
                                    onClick={handleCopyCodUpiId}
                                    className="px-2 py-1 bg-[#596B58] hover:bg-[#495948] text-white rounded text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                  >
                                    {isCopiedCodUpi ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    <span>{isCopiedCodUpi ? "कॉपी!" : "कॉपी"}</span>
                                  </button>
                                </div>
                              </div>

                              <p className="text-[10px] text-[#7A6E65] leading-relaxed px-1">
                                💡 सुझाव: ऊपर दिए बटन से सीधे UPI ऐप खोलें या QR कोड डाउनलोड करके PhonePe / Paytm / GPay में "गैलरी से QR स्कैन करें" (Scan QR from Gallery) से भुगतान करें।
                              </p>

                              {/* Step 1 Next Button */}
                              <Button
                                type="button"
                                onClick={() => setCodStep(2)}
                                className="w-full h-11 bg-[#596B58] hover:bg-[#495948] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 mt-2"
                              >
                                <span>भुगतान पूरा हो गया? रसीद / UTR डालें ➔</span>
                              </Button>
                            </div>
                          )}

                          {/* SUB-STEP 2: SUBMIT RECEIPT / UTR FOR COD */}
                          {codStep === 2 && (
                            <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] space-y-3.5 shadow-xs animate-in fade-in duration-200">
                              <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                                <span className="font-bold text-[#3B302B]">
                                  50% एडवांस राशि:{" "}
                                  <span className="text-emerald-700 font-extrabold text-sm">₹{codAdvanceAmount}</span>
                                </span>
                                <span className="text-[10px] text-amber-900 bg-amber-100 font-bold px-2 py-0.5 rounded-full">
                                  डिलीवरी पर देय: ₹{codRemainingAmount}
                                </span>
                              </div>

                              <div>
                                <span className="text-xs font-bold text-[#3B302B] uppercase tracking-wider block">
                                  स्टेप 2: 50% अग्रिम भुगतान की रसीद जमा करें *
                                </span>
                                <p className="text-[11px] text-[#7A6E65] mt-0.5">
                                  ₹{codAdvanceAmount} भुगतान करने के बाद अपने पेमेंट का स्क्रीनशॉट या 12 अंकों का UTR नंबर अपलोड करें।
                                </p>
                              </div>

                              {/* Upload Screenshot Box */}
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#3B302B] block">
                                  पेमेंट स्क्रीनशॉट / रसीद की फोटो *
                                </label>
                                {codReceiptPreview ? (
                                  <div className="relative p-2.5 bg-[#FFF8EC] rounded-xl border border-[#596B58]/30 flex items-center gap-3">
                                    <img
                                      src={codReceiptPreview}
                                      alt="Payment receipt preview"
                                      className="h-16 w-16 rounded-lg object-cover border border-[#E5DEC9]"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-bold text-[#3B302B] block truncate flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        <span>50% एडवांस रसीद संलग्न है</span>
                                      </span>
                                      <span className="text-[10px] text-[#7A6E65]">
                                        ऑर्डर देने के लिए तैयार
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setCodReceiptPreview(null)}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="रसीद हटाएं"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#E5DEC9] hover:border-[#596B58] rounded-xl cursor-pointer bg-[#FAF8F5] hover:bg-[#FFF8EC] transition-all">
                                    <UploadCloud className="h-6 w-6 text-[#596B58] mb-1" />
                                    <span className="text-xs font-bold text-[#3B302B]">
                                      स्क्रीनशॉट अपलोड करने के लिए क्लिक करें
                                    </span>
                                    <span className="text-[10px] text-[#7A6E65]">
                                      PNG, JPG, JPEG अधिकतम 10MB
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleCodReceiptFileChange}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>

                              {/* Divider */}
                              <div className="flex items-center gap-2 py-1">
                                <div className="h-px bg-[#E5DEC9] flex-1" />
                                <span className="text-[10px] font-bold text-[#7A6E65] uppercase px-1">
                                  या / OR
                                </span>
                                <div className="h-px bg-[#E5DEC9] flex-1" />
                              </div>

                              {/* UTR / Transaction ID */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#3B302B] block">
                                  यूपीआई रेफरेंस / यूटीआर नंबर (12 अंक)
                                </label>
                                <input
                                  type="text"
                                  placeholder="उदा. 4235XXXXXXXX"
                                  value={codTransactionId}
                                  onChange={(e) => setCodTransactionId(e.target.value)}
                                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5DEC9] bg-white outline-none focus:border-[#596B58]"
                                />
                                <span className="text-[10px] text-[#7A6E65] block">
                                  PhonePe / Google Pay / Paytm की रसीद में 12 अंकों का UTR नंबर मिलता है।
                                </span>
                              </div>

                              {/* Step 2 Back & Confirm Buttons */}
                              <div className="flex items-center gap-2 pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCodStep(1)}
                                  className="flex-1 h-11 text-xs font-bold border-[#E5DEC9]"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                                  <span>वापस QR देखें</span>
                                </Button>

                                <Button
                                  type="button"
                                  onClick={handlePlaceOrder}
                                  isLoading={isPlacingOrder}
                                  className="flex-1 h-11 bg-[#596B58] hover:bg-[#495948] text-white font-bold text-xs rounded-xl shadow-md"
                                >
                                  <Lock className="h-3.5 w-3.5 mr-1" />
                                  <span>ऑर्डर प्लेस करें (₹{codAdvanceAmount} एडवांस)</span>
                                </Button>
                              </div>

                              {!codReceiptPreview && !codTransactionId.trim() && (
                                <p className="text-[11px] text-amber-800 font-semibold text-center bg-amber-50 p-2 rounded-lg border border-amber-200">
                                  ⚠️ ऑर्डर प्लेस करने के लिए 50% एडवांस भुगतान का स्क्रीनशॉट या 12 अंकों का UTR नंबर भरना अनिवार्य है।
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Collapsible Items in Order (Mobile & Review) */}
                <div className="p-4 bg-white rounded-2xl border border-[#E5DEC9] space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsItemsExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between text-xs font-bold text-[#3B302B] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-[#596B58]" />
                      <span>{t("checkout.itemsInOrder", "Items in Order")} ({directItem ? 1 : checkoutPreview?.items?.length || 0})</span>
                    </span>
                    <span className="text-[#596B58] text-[11px] font-bold">
                      {isItemsExpanded ? t("checkout.hideItems", "Hide Items ▲") : t("checkout.viewItems", "View Items ▼")}
                    </span>
                  </button>

                  {isItemsExpanded && (
                    <div className="pt-2 divide-y divide-[#E5DEC9]/60 max-h-56 overflow-y-auto">
                      {directItem ? (
                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={directItem.mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"}
                              alt={directItem.name}
                              className="h-10 w-10 rounded-lg object-cover shrink-0 border border-[#E5DEC9]"
                            />
                            <div className="min-w-0">
                              <p className="font-bold truncate text-[#3B302B]">{directItem.name}</p>
                              <p className="text-[10px] text-[#7A6E65]">{t("checkout.qty", "Qty:")} {directItem.quantity}</p>
                            </div>
                          </div>
                          <span className="font-extrabold text-[#3B302B]">₹{directItem.itemTotal}</span>
                        </div>
                      ) : (
                        (checkoutPreview?.items || []).map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-lg object-cover shrink-0 border border-[#E5DEC9]"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="font-bold truncate text-[#3B302B]">{item.name}</p>
                                <p className="text-[10px] text-[#7A6E65]">{t("checkout.qty", "Qty:")} {item.quantity}</p>
                              </div>
                            </div>
                            <span className="font-extrabold text-[#3B302B]">₹{item.itemTotal}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile-Only Order Summary in Step 3 */}
                <div className="block lg:hidden space-y-4">
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
                    paymentMethod={paymentMethod}
                    manualUpiDiscount={manualUpiDiscount}
                    onCouponChanged={fetchAddressesAndPreview}
                    deliveryThreshold={checkoutPreview?.deliveryThreshold}
                    fulfillmentType={fulfillmentType}
                    onSwitchToPickup={() => setFulfillmentType("STORE_PICKUP")}
                  />
                </div>

                {/* Step 3 Navigation Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="w-full sm:w-auto px-5 h-12 border-[#E5DEC9]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    <span>{t("checkout.backToDeliveryTiming", "Back to Delivery Timing")}</span>
                  </Button>

                  {isBelowMin ? (
                    <Button
                      onClick={handlePlaceOrder}
                      className="w-full sm:w-auto px-6 h-12 shadow-md bg-amber-600 hover:bg-amber-700"
                    >
                      <span>{t("checkout.addMoreForHomeDelivery", { amount: remainingForMin, defaultValue: `Add ₹${remainingForMin} More for Home Delivery` })}</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (paymentMethod === "MANUAL_UPI" && manualUpiStep === 1) {
                          setManualUpiStep(2);
                        } else if (paymentMethod === "COD" && codStep === 1) {
                          setCodStep(2);
                        } else {
                          handlePlaceOrder();
                        }
                      }}
                      isLoading={isPlacingOrder}
                      className="w-full sm:w-auto px-6 h-12 shadow-md bg-[#596B58] hover:bg-[#495948]"
                    >
                      <Lock className="h-4 w-4 mr-1.5" />
                      <span>
                        {paymentMethod === "COD"
                          ? codStep === 1
                            ? t("checkout.proceedToStep2", "भुगतान पूरा हो गया? रसीद / UTR डालें ➔")
                            : t("checkout.confirmCodWithAdvance", { advance: codAdvanceAmount, defaultValue: `ऑर्डर प्लेस करें (₹${codAdvanceAmount} एडवांस जमा)` })
                          : paymentMethod === "MANUAL_UPI"
                          ? manualUpiStep === 1
                            ? t("checkout.proceedToStep2", "भुगतान पूरा हो गया? रसीद / UTR डालें ➔")
                            : t("checkout.confirmOrderWithAmount", { amount: payableAmount, defaultValue: `ऑर्डर कन्फर्म करें (₹${payableAmount})` })
                          : t("checkout.payRazorpayAmount", { amount: payableAmount, defaultValue: `Pay ₹${payableAmount} with Razorpay` })}
                      </span>
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#27AE60]" />
                  <span>
                    {paymentMethod === "COD"
                      ? t("checkout.codSecurityNotice", `50% अग्रिम भुगतान (₹${codAdvanceAmount}) UPI से एवं शेष ₹${codRemainingAmount} डिलीवरी पर नकद।`)
                      : paymentMethod === "MANUAL_UPI"
                      ? t("checkout.manualUpiSecurityNotice", "Flat 1.5% discount automatically applied. Order confirmed after receipt verification.")
                      : t("checkout.razorpaySecurityNotice", "100% secure payment processed securely by Razorpay.")}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Desktop Right Summary (Sticky) */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
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
              deliveryThreshold={checkoutPreview?.deliveryThreshold}
              fulfillmentType={fulfillmentType}
              onSwitchToPickup={() => setFulfillmentType("STORE_PICKUP")}
              paymentMethod={paymentMethod}
              manualUpiDiscount={manualUpiDiscount}
            />

            {/* Desktop Dynamic Step Action Button */}
            {currentStep === 1 && (
              <Button
                onClick={handleNextStep}
                className="w-full h-12 shadow-md"
              >
                <span>{t("checkout.continueToDeliveryTiming", "Continue to Delivery Timing")}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                onClick={handleNextStep}
                className="w-full h-12 shadow-md"
              >
                <span>{t("checkout.continueToReviewPayment", "Continue to Review & Payment")}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}

            {currentStep === 3 && (
              <>
                {isBelowMin ? (
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full h-12 shadow-md bg-amber-600 hover:bg-amber-700"
                  >
                    <span>{t("checkout.addMoreForHomeDelivery", { amount: remainingForMin, defaultValue: `Add ₹${remainingForMin} More for Home Delivery` })}</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (paymentMethod === "MANUAL_UPI" && manualUpiStep === 1) {
                        setManualUpiStep(2);
                      } else if (paymentMethod === "COD" && codStep === 1) {
                        setCodStep(2);
                      } else {
                        handlePlaceOrder();
                      }
                    }}
                    isLoading={isPlacingOrder}
                    className="w-full h-12 shadow-md"
                  >
                    <span>
                      {paymentMethod === "COD"
                        ? codStep === 1
                          ? t("checkout.proceedToStep2", "भुगतान पूरा हो गया? रसीद / UTR डालें ➔")
                          : t("checkout.confirmCodWithAdvance", { advance: codAdvanceAmount, defaultValue: `ऑर्डर प्लेस करें (₹${codAdvanceAmount} एडवांस जमा)` })
                        : paymentMethod === "MANUAL_UPI"
                        ? manualUpiStep === 1
                          ? t("checkout.proceedToStep2", "भुगतान पूरा हो गया? रसीद / UTR डालें ➔")
                          : t("checkout.confirmOrderWithAmount", { amount: payableAmount, defaultValue: `ऑर्डर कन्फर्म करें (₹${payableAmount})` })
                        : t("checkout.payRazorpayAmount", { amount: payableAmount, defaultValue: `Pay ₹${payableAmount} with Razorpay` })}
                    </span>
                  </Button>
                )}
              </>
            )}

            {fulfillmentType === "HOME_DELIVERY" && checkoutPreview?.deliveryThreshold ? (
              (() => {
                const freeThreshold = checkoutPreview.deliveryThreshold.freeDeliveryThreshold ?? 350;
                const remainingForFree = Math.max(0, freeThreshold - subtotal);

                if (isBelowMin) {
                  return (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-900 text-center font-bold">
                      {t("checkout.minOrderWarningBanner", {
                        amount: minDelivery,
                        remaining: remainingForMin,
                        defaultValue: `⚠️ Home Delivery ke liye minimum order ₹${minDelivery} hai (₹${remainingForMin} baaki hai).`,
                      })}
                    </div>
                  );
                }

                if (checkoutPreview.pricing?.deliveryFee > 0 && remainingForFree > 0) {
                  return (
                    <div className="p-2.5 bg-[#FFF8EC] border border-[#596B58]/25 rounded-xl text-[11px] text-[#596B58] text-center font-bold">
                      {t("checkout.freeDeliveryBanner", {
                        amount: remainingForFree,
                        fee: checkoutPreview.pricing?.deliveryFee,
                        defaultValue: `🚚 ₹${remainingForFree} aur add karein aur delivery charge (₹${checkoutPreview.pricing?.deliveryFee}) FREE payein!`,
                      })}
                    </div>
                  );
                }

                return null;
              })()
            ) : null}

            <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" />
              <span>
                {paymentMethod === "COD"
                  ? t("checkout.codSecurityNotice", `50% अग्रिम भुगतान (₹${codAdvanceAmount}) UPI से एवं शेष ₹${codRemainingAmount} डिलीवरी पर नकद।`)
                  : paymentMethod === "MANUAL_UPI"
                  ? t("checkout.manualUpiSecurityNotice", "Flat 1.5% discount automatically applied. Order confirmed after receipt verification.")
                  : t("checkout.razorpaySecurityNotice", "100% secure payment processed securely by Razorpay.")}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar: 1-Click Action without Scrolling */}
      {!isLoading && (directItem || (checkoutPreview?.items && checkoutPreview.items.length > 0)) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DEC9] p-3 sm:p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E65]">
              {t("checkout.stepCount", { current: currentStep, total: 3, defaultValue: `Total (Step ${currentStep}/3)` })}
            </p>
            <p className="text-lg font-extrabold text-[#596B58] leading-tight">
              {paymentMethod === "COD" && currentStep === 3 ? (
                <span>
                  ₹{codAdvanceAmount} <span className="text-[10px] text-amber-800 font-semibold">(50% Adv)</span>
                </span>
              ) : (
                `₹${payableAmount}`
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-3 py-2.5 rounded-xl border border-[#E5DEC9] bg-[#FFF8EC] text-xs font-bold text-[#3B302B] hover:bg-amber-100 transition-colors cursor-pointer"
                title="Previous Step"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            {currentStep === 1 && (
              <Button
                onClick={handleNextStep}
                className="px-4 py-2.5 text-xs font-bold shadow-sm"
              >
                <span>{t("checkout.nextTiming", "Next: Timing")}</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                onClick={handleNextStep}
                className="px-4 py-2.5 text-xs font-bold shadow-sm"
              >
                <span>{t("checkout.nextPayment", "Next: Payment")}</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                onClick={() => {
                  if (paymentMethod === "MANUAL_UPI" && manualUpiStep === 1) {
                    setManualUpiStep(2);
                  } else if (paymentMethod === "COD" && codStep === 1) {
                    setCodStep(2);
                  } else {
                    handlePlaceOrder();
                  }
                }}
                isLoading={isPlacingOrder}
                className="px-4 py-2.5 text-xs font-bold shadow-sm"
              >
                <span>
                  {paymentMethod === "COD"
                    ? codStep === 1
                      ? t("checkout.nextSubmitReceipt", "भुगतान हो गया? आगे बढ़ें ➔")
                      : t("checkout.placeCodAdvance", { advance: codAdvanceAmount, defaultValue: `Place COD (₹${codAdvanceAmount})` })
                    : paymentMethod === "MANUAL_UPI"
                    ? manualUpiStep === 1
                      ? t("checkout.nextSubmitReceipt", "भुगतान हो गया? आगे बढ़ें ➔")
                      : t("checkout.confirmOrderWithAmount", { amount: payableAmount, defaultValue: `ऑर्डर कन्फर्म करें (₹${payableAmount})` })
                    : `Pay ₹${payableAmount}`}
                </span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Inline Create Address Modal */}
      <Modal isOpen={isAddAddressModalOpen} onClose={() => setIsAddAddressModalOpen(false)} title={t("checkout.createDeliveryAddress", "Create Delivery Address")}>
        <form onSubmit={addressForm.handleSubmit(handleCreateInlineAddress)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={`${t("checkout.fullName", "Name")} *`} placeholder="Recipient Name" {...addressForm.register("name")} error={addressForm.formState.errors.name?.message} />
            <Input label={`${t("checkout.email", "Email")} *`} type="email" placeholder="example@email.com" {...addressForm.register("email")} error={addressForm.formState.errors.email?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={`${t("checkout.phone", "Mobile (Mob)")} *`} placeholder="9876543210" maxLength={10} {...addressForm.register("phone")} error={addressForm.formState.errors.phone?.message} />
            <Input label={`${t("checkout.district", "District")} *`} placeholder="District Name" {...addressForm.register("district")} error={addressForm.formState.errors.district?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3B302B] flex items-center justify-between">
                <span>{t("checkout.village", "Village (Select Village)")} *</span>
                <span className="text-[10px] text-[#596B58]">{t("checkout.chooseFromList", "Choose from list")}</span>
              </label>
              <CustomSelect
                value={addressForm.watch("village")}
                onChange={(selectedName) => {
                  addressForm.setValue("village", selectedName, { shouldValidate: true });
                  const matched = villages.find((v) => v.name === selectedName);
                  if (matched) {
                    addressForm.setValue("district", matched.district, { shouldValidate: true });
                    addressForm.setValue("pincode", matched.pincode, { shouldValidate: true });
                  }
                }}
                placeholder={t("checkout.chooseVillagePlaceholder", "-- Choose Village --")}
                searchable={villages.length > 5}
                options={villages.map((v) => ({
                  value: v.name,
                  label: `${v.name} (${v.district})`,
                }))}
                error={addressForm.formState.errors.village?.message}
              />
            </div>

            <Input label={`${t("checkout.pincode", "Pincode")} *`} placeholder="110001" maxLength={6} {...addressForm.register("pincode")} error={addressForm.formState.errors.pincode?.message} />
          </div>

          <Input label={`${t("checkout.street", "Address (Street / House Details)")} *`} placeholder="House No., Street, Landmark" {...addressForm.register("street")} error={addressForm.formState.errors.street?.message} />

          <Button type="submit" className="w-full mt-4" isLoading={isAddingAddress}>
            {t("checkout.saveAddressAndSelect", "Save Address & Select for Checkout")}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
