export const NOTIFICATION_TYPES = [
  "OTP",
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "ORDER_STATUS_UPDATED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "ORDER_CANCELLED",
  "CUSTOM_CAKE_UPDATE",
  "ADMIN_NOTIFICATION",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PROVIDERS = [
  "IN_APP",
  "EMAIL",
  "SMS",
  "WHATSAPP",
  "PUSH",
] as const;

export type NotificationProviderType =
  (typeof NOTIFICATION_PROVIDERS)[number];

export const NOTIFICATION_STATUSES = [
  "PENDING",
  "QUEUED",
  "SENDING",
  "SENT",
  "FAILED",
  "CANCELLED",
] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const MAX_RETRY_LIMIT = 3;
