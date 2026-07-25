export const OTP_CONSTANTS = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  EXPIRY_MS: 5 * 60 * 1000,
  MAX_ATTEMPTS: 5,
  MAX_RESENDS: 3,
  COOLDOWN_SECONDS: 60,
  COOLDOWN_MS: 60 * 1000,
} as const;

export const OTP_RESPONSE_MESSAGES = {
  SEND_ACCEPTED: "OTP request accepted.",
  VERIFY_SUCCESS: "OTP verification processed.",
  COOLDOWN_ACTIVE: "Please wait before requesting another OTP.",
  RESEND_LIMIT_REACHED: "OTP resend limit reached. Please try again later.",
  INVALID_OR_EXPIRED: "Invalid or expired OTP.",
  ATTEMPTS_EXCEEDED: "OTP verification limit reached. Please request a new OTP.",
} as const;

export const OTP_RATE_LIMITS = {
  SEND_WINDOW_MS: 15 * 60 * 1000,
  SEND_MAX: 5,
  VERIFY_WINDOW_MS: 15 * 60 * 1000,
  VERIFY_MAX: 10,
} as const;
