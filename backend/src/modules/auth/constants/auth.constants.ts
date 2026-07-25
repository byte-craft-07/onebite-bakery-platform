export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

export const AUTH_TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;

export const AUTH_RESPONSE_MESSAGES = {
  AUTHENTICATED: "Authentication successful.",
  CURRENT_USER: "Current user fetched successfully.",
  REFRESHED: "Session refreshed successfully.",
  LOGGED_OUT: "Logged out successfully.",
  LOGGED_OUT_ALL: "Logged out from all devices successfully.",
  AUTHENTICATION_REQUIRED: "Authentication required.",
  INVALID_REFRESH_TOKEN: "Invalid or expired refresh token.",
  USER_BLOCKED: "Account is blocked.",
} as const;

export const AUTH_RATE_LIMITS = {
  REFRESH_WINDOW_MS: 15 * 60 * 1000,
  REFRESH_MAX: 30,
  SESSION_WINDOW_MS: 15 * 60 * 1000,
  SESSION_MAX: 60,
} as const;
