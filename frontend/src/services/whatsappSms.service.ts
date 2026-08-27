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
      return Boolean(response.data?.success);
    } catch (_err) {
      return false;
    }
  },
};
