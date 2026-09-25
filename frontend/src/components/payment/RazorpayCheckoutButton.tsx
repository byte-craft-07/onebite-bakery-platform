import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { apiClient } from "@/services/api.client";
import { toast } from "@/contexts/toast.context";


export interface RazorpayPaymentSuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutButtonProps {
  /**
   * Amount in Rupees (default: 100) or specify in paise if isAmountInPaise is true
   */
  amount?: number;
  /**
   * Set true if amount is already in paise (min 100 paise)
   */
  isAmountInPaise?: boolean;
  currency?: string;
  receipt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (payload: RazorpayPaymentSuccessPayload & { verified: boolean }) => void;
  onFailure?: (error: unknown) => void;
  onDismiss?: () => void;
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  amount = 100,
  isAmountInPaise = false,
  currency = "INR",
  receipt,
  customerName = "Bakery Customer",
  customerEmail = "customer@example.com",
  customerPhone = "9876543210",
  buttonText,
  className = "",
  disabled = false,
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Convert to paise for Razorpay API (minimum 100 paise)
  const amountInPaise = isAmountInPaise ? Math.round(amount) : Math.round(amount * 100);
  const displayAmount = isAmountInPaise ? (amount / 100).toFixed(2) : amount.toFixed(2);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Ensure Razorpay Checkout SDK is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        const msg = "Unable to load Razorpay checkout SDK. Please check your internet connection.";
        setErrorMessage(msg);
        toast.error("Checkout Error", msg);
        setIsLoading(false);
        onFailure?.(new Error(msg));
        return;
      }

      // 2. Call backend to create Razorpay Order (STEP 1)
      // Endpoint: POST /api/create-order or /api/v1/create-order
      const orderResponse = await apiClient.post<{
        order_id?: string;
        id?: string;
        amount: number;
        currency: string;
        key_id?: string;
      }>("/create-order", {
        amount: amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
      });

      const orderData = orderResponse.data;
      const razorpayOrderId = orderData.order_id || orderData.id;

      if (!razorpayOrderId) {
        throw new Error("Backend did not return an order_id.");
      }

      // 3. Resolve Public Razorpay Key ID
      const razorpayKey =
        orderData.key_id ||
        (import.meta.env.VITE_RAZORPAY_KEY_ID as string) ||
        "";

      if (!razorpayKey) {
        throw new Error("Razorpay Key ID is not configured in VITE_RAZORPAY_KEY_ID.");
      }

      // 4. Open Razorpay Standard Checkout Modal (STEP 2)
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Onebite Bakery",
        description: `Order Payment ₹${displayAmount}`,
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&q=80",
        order_id: razorpayOrderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: "#596B58",
        },
        readonly: {
          contact: false,
          email: false,
          name: false,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setIsLoading(true);
          try {
            // 5. Send credentials to verify endpoint (STEP 3)
            // Endpoint: POST /api/verify-payment or /api/v1/verify-payment
            const verifyResponse = await apiClient.post<{
              success: boolean;
              message?: string;
              order_id?: string;
              payment_id?: string;
            }>("/verify-payment", {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data?.success) {
              toast.success("Payment Successful! 🎉", "Your payment has been verified securely.");
              onSuccess?.({
                ...response,
                verified: true,
              });
            } else {
              const failureMsg = verifyResponse.data?.message || "Signature verification failed.";
              setErrorMessage(failureMsg);
              toast.error("Payment Verification Failed", failureMsg);
              onFailure?.(new Error(failureMsg));
            }
          } catch (verifyErr) {
            const msg = "Payment verification request failed. Please check server logs.";
            setErrorMessage(msg);
            toast.error("Verification Error", msg);
            onFailure?.(verifyErr);
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            // Handle modal dismiss (user cancelled)
            setIsLoading(false);
            const cancelMsg = "Payment was cancelled or closed.";
            toast.info("Payment Cancelled", cancelMsg);
            onDismiss?.();
            onFailure?.({ cancelled: true, message: cancelMsg });
          },
        },
      };

      const razorpayConstructor = (window as any).Razorpay;
      const razorpayInstance = new razorpayConstructor(options);

      // Handle payment.failed event
      razorpayInstance.on("payment.failed", (failedRes: any) => {
        setIsLoading(false);
        const reason = failedRes?.error?.description || "Payment failed. Please try again.";
        setErrorMessage(reason);
        toast.error("Payment Failed", reason);
        onFailure?.(failedRes?.error || failedRes);
      });

      razorpayInstance.open();
    } catch (err: any) {
      setIsLoading(false);
      const errText = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to start payment checkout.";
      setErrorMessage(errText);
      toast.error("Payment Error", errText);
      onFailure?.(err);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-[#596B58] hover:bg-[#495948] transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            <span>{buttonText || `Pay ₹${displayAmount} with Razorpay`}</span>
          </>
        )}
      </button>

      {errorMessage && (
        <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
