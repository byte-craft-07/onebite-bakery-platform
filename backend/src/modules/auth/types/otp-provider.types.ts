import type { OtpPurpose } from "../model/index.js";

export interface OtpDeliveryPayload {
  phone: string;
  purpose: OtpPurpose;
  otp: string;
  expiresAt: Date;
}

export interface OtpProvider {
  sendOtp(payload: OtpDeliveryPayload): Promise<void>;
}
