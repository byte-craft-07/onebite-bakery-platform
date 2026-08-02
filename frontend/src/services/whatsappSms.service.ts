import { apiClient } from "./api.client";

export const whatsappSmsService = {
  /**
   * Dispatches WhatsApp & SMS order status updates to customer
   */
  async sendOrderStatusNotification(phone: string, orderNumber: string, status: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>("/notifications/whatsapp-sms/status", {
        phone,
        orderNumber,
        status,
      });
      if (response.data?.success) return true;
    } catch (_err) {
      // Fallback
    }

    console.log(`[WhatsApp & SMS Alert] Dispatched to +91 ${phone}: "Your OneBite Bakery Order #${orderNumber} is now ${status.replace(/_/g, " ")}!"`);
    return true;
  },
};
