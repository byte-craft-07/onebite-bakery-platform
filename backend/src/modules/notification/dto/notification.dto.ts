import type {
  NotificationProviderType,
  NotificationStatus,
  NotificationType,
} from "../constants/index.js";

export interface SendNotificationDto {
  recipient: string;
  type: NotificationType;
  template: string;
  payload: Record<string, unknown>;
  userId?: string;
  provider?: NotificationProviderType;
  orderId?: string;
  orderNumber?: string;
  isRead?: boolean;
}

export interface NotificationHistoryQueryDto {
  page?: number;
  limit?: number;
  type?: NotificationType;
  status?: NotificationStatus;
  isRead?: boolean;
}

