export interface SendOtpResult {
  expiresInSeconds: number;
  cooldownSeconds: number;
  devOtp?: string;
  devHint?: string;
}

export interface VerifyOtpResult {
  verified: true;
}

