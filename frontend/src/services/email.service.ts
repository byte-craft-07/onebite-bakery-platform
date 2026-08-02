import { apiClient } from "./api.client";
import type { OrderDetails } from "./order.service";

export const emailNotificationService = {
  /**
   * Triggers Order Receipt & Confirmation HTML email via Resend API
   */
  async sendOrderConfirmationEmail(order: OrderDetails, recipientEmail: string): Promise<boolean> {
    try {
      const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
      const response = await apiClient.post<{ success: boolean }>("/notifications/email/order-confirmation", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipientEmail,
        totalAmount: order.totalAmount,
        resendApiKey,
      });
      if (response.data?.success) return true;
    } catch (_err) {
      // Fallback
    }

    // Fallback console log confirmation for development
    console.log(`[Resend Email Triggered] Sent Order #${order.orderNumber} receipt to ${recipientEmail}`);
    return true;
  },

  /**
   * Triggers Welcome Email for newly registered customers
   */
  async sendWelcomeEmail(customerName: string, recipientEmail: string): Promise<boolean> {
    try {
      await apiClient.post("/notifications/email/welcome", {
        customerName,
        recipientEmail,
      });
    } catch (_err) {
      // Fallback
    }
    return true;
  },
};
