import type {
  NotificationProviderType,
  NotificationStatus,
  NotificationType,
} from "../constants/index.js";

export interface NotificationResponse {
  id: string;
  userId?: string;
  type: NotificationType;
  provider: NotificationProviderType;
  template: string;
  subject: string;
  recipient: string;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  retryCount: number;
  providerMessageId?: string;
  failureReason?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
