import { apiClient } from "./api.client";
import { paymentService, type InitiatePaymentResponse } from "./payment.service";

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
  paymentId?: string;
  orderId?: string;
}

export interface RazorpayPaymentSuccessPayload {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
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
  config?: {
    display: {
      blocks: {
        upi: {
          name: string;
          instruments: Array<{
            method: "upi";
          }>;
        };
      };
      sequence: string[];
      preferences: {
        show_default_blocks: boolean;
      };
    };
  };
  handler: (response: RazorpayPaymentSuccessPayload) => Promise<void>;
  modal: {
    ondismiss: () => void;
  };
}

const isDevelopment = import.meta.env.DEV;
const configuredRazorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
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
  async createRazorpayOrder(orderId: string): Promise<RazorpayOrderResponse> {
    try {
      const response = await apiClient.post<RazorpayOrderResponse>("/payments/razorpay/create-order", {
        orderId,
      });
      if (response.data?.id) return response.data;
    } catch (err) {
      if (!isDevelopment || configuredRazorpayKeyId) {
        throw err;
      }
    }

    return {
      id: `rzp_local_${Date.now()}`,
      amount: 0,
      currency: "INR",
      receipt: orderId,
      status: "created",
    };
  },

  /**
   * Verify Razorpay Payment Signature on Backend
   */
  async verifyPayment(orderId: string, payload: RazorpayPaymentSuccessPayload): Promise<{ verified: boolean; paymentStatus?: string }> {
    try {
      const result = await paymentService.verifyPayment({
        orderId,
        razorpayOrderId: payload.razorpay_order_id || "",
        razorpayPaymentId: payload.razorpay_payment_id,
        razorpaySignature: payload.razorpay_signature || "",
      });

      return {
        verified: result.success,
        paymentStatus: result.paymentStatus,
      };
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
    payment: InitiatePaymentResponse;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    onSuccess: (payload: RazorpayPaymentSuccessPayload) => void;
    onDismiss?: () => void;
  }): Promise<void> {
    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded) {
      if (options.onDismiss) options.onDismiss();
      return;
    }

    const razorpayOrder: RazorpayOrderResponse = {
      id: options.payment.providerOrderId,
      amount: Math.round(options.payment.amount * 100),
      currency: options.payment.currency,
      receipt: options.payment.orderId,
      status: "created",
      keyId: options.payment.razorpayKeyId,
      paymentId: options.payment.paymentId,
      orderId: options.payment.orderId,
    };

    const isMockOrder = isMockRazorpayOrder(razorpayOrder);

    if (configuredRazorpayKeyId && isMockOrder) {
      throw new Error("Razorpay backend did not return a real order id. Please check backend Razorpay connectivity.");
    }

    if (isDevelopment && !configuredRazorpayKeyId && isMockOrder) {
      throw new Error("Razorpay is not configured for this environment.");
    }

    // Validate real server-created Razorpay order ID (e.g. order_TLZ1nlVM41WRJV)
    const isRealRazorpayOrderId = (id?: string) => {
      if (!id) return false;
      return id.startsWith("order_") && !id.includes("receipt") && !id.includes("local") && !id.includes("mock") && id.length <= 25;
    };

    const validOrderId = isRealRazorpayOrderId(razorpayOrder.id) ? razorpayOrder.id : undefined;

    const rzpOptions: RazorpayCheckoutOptions = {
      key: razorpayOrder.keyId || configuredRazorpayKeyId || "",
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || "INR",
      name: "OneBite Bakery Platform",
      description: `UPI payment for order #${options.payment.orderId.slice(-6).toUpperCase()}`,
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
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay via UPI",
              instruments: [
                {
                  method: "upi",
                },
              ],
            },
          },
          sequence: ["block.upi"],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
      handler: async (response: RazorpayPaymentSuccessPayload) => {
        const verifyRes = await razorpayService.verifyPayment(options.payment.orderId, response);
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
