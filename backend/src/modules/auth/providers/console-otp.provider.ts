import { logger } from "../../../shared/utils/logger.js";
import { maskOtp, maskPhone } from "../utils/index.js";
import type { OtpDeliveryPayload, OtpProvider } from "../types/index.js";

export class ConsoleOtpProvider implements OtpProvider {
  public async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    logger.info(
      {
        phone: maskPhone(payload.phone),
        purpose: payload.purpose,
        otpMasked: maskOtp(payload.otp),
        expiresAt: payload.expiresAt.toISOString(),
      },
      "Development OTP provider accepted delivery request",
    );
  }
}
