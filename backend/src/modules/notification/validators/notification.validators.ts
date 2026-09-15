import { z } from "zod";

import {
  NOTIFICATION_PROVIDERS,
  NOTIFICATION_TYPES,
} from "../constants/index.js";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid object id.");

export const notificationIdParamSchema = z.object({
  id: objectIdSchema,
});

export const sendNotificationSchema = z.object({
  recipient: z.string().trim().min(3, "Recipient address or phone is required."),
  type: z.enum(NOTIFICATION_TYPES),
  template: z.string().trim().min(1, "Notification template is required."),
  payload: z.record(z.unknown()),
  userId: objectIdSchema.optional(),
  provider: z.enum(NOTIFICATION_PROVIDERS).optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().trim().url("Invalid push subscription endpoint URL."),
  keys: z.object({
    p256dh: z.string().trim().min(1, "p256dh key is required."),
    auth: z.string().trim().min(1, "auth secret is required."),
  }),
  deviceInfo: z.record(z.unknown()).optional(),
  userAgent: z.string().optional(),
});

export const unsubscribePushSchema = z.object({
  endpoint: z.string().trim().url("Invalid push subscription endpoint URL."),
});

