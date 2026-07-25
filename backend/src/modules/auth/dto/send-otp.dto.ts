import type { OtpPurpose } from "../model/index.js";

export interface SendOtpDto {
  phone: string;
  purpose: OtpPurpose;
}
