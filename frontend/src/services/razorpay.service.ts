import { apiClient } from "./api.client";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  isMock?: boolean;
  keyId?: string;
}

export interface RazorpayPaymentSuccessPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutInstance {
  on(eventName: "payment.failed", handler: () => void): void;
  open(): void;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  readonly: {
    contact: boolean;
    email: boolean;
    name: boolean;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayPaymentSuccessPayload) => Promise<void>;
  modal: {
    ondismiss: () => void;
  };
}

const isDevelopment = import.meta.env.DEV;
const isMockRazorpayOrder = (order: RazorpayOrderResponse): boolean =>
  Boolean(order.isMock) || order.id.startsWith("rzp_local_");

export const razorpayService = {
  /**
   * Dynamically load Razorpay Checkout JS SDK script
   */
  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Create Razorpay Order on Backend
   */
  async createRazorpayOrder(amountInRupees: number, orderId: string): Promise<RazorpayOrderResponse> {
    try {
      const response = await apiClient.post<RazorpayOrderResponse>("/payments/razorpay/create-order", {
        amount: Math.round(amountInRupees * 100), // Razorpay works in paise
        currency: "INR",
        receipt: `receipt_${orderId}`,
      });
      if (response.data?.id) return response.data;
    } catch {
      if (!isDevelopment) {
        throw new Error("Unable to create Razorpay order.");
      }
    }

    return {
      id: `rzp_local_${Date.now()}`,
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt: `receipt_${orderId}`,
      status: "created",
    };
  },

  /**
   * Verify Razorpay Payment Signature on Backend
   */
  async verifyPayment(payload: RazorpayPaymentSuccessPayload): Promise<{ verified: boolean }> {
    try {
      const response = await apiClient.post<{ verified: boolean }>("/payments/razorpay/verify", payload);
      if (response.data) return response.data;
    } catch {
      if (!isDevelopment) {
        throw new Error("Unable to verify Razorpay payment.");
      }
    }

    return { verified: false };
  },

  /**
   * Open Razorpay Popup
   */
  async openPaymentModal(options: {
    amountInRupees: number;
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    onSuccess: (payload: RazorpayPaymentSuccessPayload) => void;
    onDismiss?: () => void;
  }): Promise<void> {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TLYhqUJgQVFJ7z";

    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded) {
      if (options.onDismiss) options.onDismiss();
      return;
    }

    const razorpayOrder = await this.createRazorpayOrder(options.amountInRupees, options.orderId);

    if (isDevelopment && isMockRazorpayOrder(razorpayOrder)) {
      window.setTimeout(() => {
        options.onSuccess({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: `pay_local_${Date.now()}`,
          razorpay_signature: "development-mock-signature",
        });
      }, 250);
      return;
    }

    // Validate real server-created Razorpay order ID (e.g. order_TLZ1nlVM41WRJV)
    const isRealRazorpayOrderId = (id?: string) => {
      if (!id) return false;
      return id.startsWith("order_") && !id.includes("receipt") && !id.includes("local") && !id.includes("mock") && id.length <= 25;
    };

    const validOrderId = isRealRazorpayOrderId(razorpayOrder.id) ? razorpayOrder.id : undefined;

    const rzpOptions = {
      key: razorpayOrder.keyId || keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || "INR",
      name: "OneBite Bakery Platform",
      description: `Payment for Bakery Order #${options.orderId.slice(-6).toUpperCase()}`,
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&q=80",
      order_id: validOrderId,
      prefill: {
        name: options.customerName || "OneBite Customer",
        email: options.customerEmail || "ajaykterha@gmail.com",
        contact: options.customerPhone || "7897671632",
      },
      readonly: {
        contact: true,
        email: true,
        name: true,
      },
      theme: {
        color: "#E67E22",
      },
      handler: async (response: RazorpayPaymentSuccessPayload) => {
        const verifyRes = await razorpayService.verifyPayment(response);
        if (verifyRes.verified) {
          options.onSuccess(response);
        } else {
          options.onDismiss?.();
        }
      },
      modal: {
        ondismiss: () => {
          if (options.onDismiss) {
            options.onDismiss();
          }
        },
      },
    };

    try {
      if (!window.Razorpay) {
        options.onDismiss?.();
        return;
      }

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on("payment.failed", () => {
        if (options.onDismiss) {
          options.onDismiss();
        }
      });
      rzp.open();
    } catch {
      if (options.onDismiss) {
        options.onDismiss();
      }
    }
  },
};
