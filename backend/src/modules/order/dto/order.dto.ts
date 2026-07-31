import type { DeliveryMethod, OrderStatus } from "../constants/index.js";

export interface AddressPayloadDto {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface CreateOrderDto {
  deliveryMethod: DeliveryMethod;
  addressId?: string;
  address?: AddressPayloadDto;
  notes?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  cancellationReason?: string;
}

export interface UpdateReadyTimeDto {
  estimatedReadyTime: string;
}

export interface CancelOrderDto {
  cancellationReason?: string;
}

export interface ListOrdersFilterDto {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  customerId?: string;
}
