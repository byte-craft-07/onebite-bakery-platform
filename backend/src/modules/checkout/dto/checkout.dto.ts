import type { DeliveryMethod } from "../../order/constants/index.js";

export interface AddressPayloadDto {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface CheckoutPreviewQueryDto {
  deliveryMethod?: DeliveryMethod;
  addressId?: string;
}

export interface ValidateCheckoutDto {
  deliveryMethod: DeliveryMethod;
  addressId?: string;
  address?: AddressPayloadDto;
}
