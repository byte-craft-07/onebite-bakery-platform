import type { OtpPurpose } from "../model/index.js";

export interface VerifyOtpDto {
  phone: string;
  purpose: OtpPurpose;
  otp: string;
}
