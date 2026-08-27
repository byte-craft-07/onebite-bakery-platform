import { apiClient } from "./api.client";
import type { OrderDetails } from "./order.service";

export const emailNotificationService = {
  /**
   * Triggers Order Receipt & Confirmation HTML email via Resend API
   */
  async sendOrderConfirmationEmail(order: OrderDetails, recipientEmail: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>("/notifications/email/order-confirmation", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipientEmail,
        totalAmount: order.totalAmount,
      });
      return Boolean(response.data?.success);
    } catch (_err) {
      return false;
    }
  },

  /**
   * Triggers Welcome Email for newly registered customers
   */
  async sendWelcomeEmail(customerName: string, recipientEmail: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>("/notifications/email/welcome", {
        customerName,
        recipientEmail,
      });
      return Boolean(response.data?.success);
    } catch (_err) {
      return false;
    }
  },
};
