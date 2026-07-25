export interface SendOtpResult {
  expiresInSeconds: number;
  cooldownSeconds: number;
}

export interface VerifyOtpResult {
  verified: true;
}
