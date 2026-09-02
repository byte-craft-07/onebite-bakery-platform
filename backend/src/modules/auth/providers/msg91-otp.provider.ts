import { env } from "../../../config/env.js";
import { logger } from "../../../shared/utils/logger.js";
import type { OtpDeliveryPayload, OtpProvider } from "../types/index.js";
import { maskOtp, maskPhone } from "../utils/index.js";

export class Msg91OtpProvider implements OtpProvider {
  public async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    const authKey = env.msg91AuthKey;
    const templateId = env.msg91TemplateId;
    const senderId = env.msg91SenderId;

    if (!authKey) {
      logger.warn(
        {
          phone: maskPhone(payload.phone),
          purpose: payload.purpose,
          otpMasked: maskOtp(payload.otp),
        },
        "MSG91_AUTH_KEY not configured. Falling back to development console OTP delivery.",
      );
      return;
    }

    // Format phone for MSG91 (India prefix 91)
    const normalizedPhone = payload.phone.replace(/\D/g, "");
    const formattedMobile = normalizedPhone.length === 10 ? `91${normalizedPhone}` : normalizedPhone;

    try {
      const url = "https://control.msg91.com/api/v5/otp";
      const params = new URLSearchParams({
        template_id: templateId || "",
        mobile: formattedMobile,
        otp: payload.otp,
      });

      if (senderId) {
        params.append("sender", senderId);
      }

      const requestUrl = `${url}?${params.toString()}`;

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
        },
      });

      const responseData = (await response.json()) as { type?: string; message?: string; code?: number };

      if (!response.ok || responseData.type === "error") {
        logger.error(
          {
            phone: maskPhone(payload.phone),
            status: response.status,
            msg91Message: responseData.message,
          },
          "MSG91 API failed to deliver OTP SMS",
        );
        throw new Error(responseData.message || "Failed to send SMS via MSG91");
      }

      logger.info(
        {
          phone: maskPhone(payload.phone),
          purpose: payload.purpose,
        },
        "MSG91 SMS OTP sent successfully",
      );
    } catch (err: unknown) {
      logger.error(
        {
          phone: maskPhone(payload.phone),
          error: err instanceof Error ? err.message : String(err),
        },
        "Error calling MSG91 OTP API",
      );
      throw err;
    }
  }
}
