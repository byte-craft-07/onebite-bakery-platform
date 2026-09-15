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
  isRead?: boolean;
  readAt?: Date;
  orderId?: string;
  orderNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}
