import { apiClient } from "./api.client";

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  addressType: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
}

export interface AddressPayload {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  addressType?: "HOME" | "WORK" | "OTHER";
  isDefault?: boolean;
}

export const addressService = {
  getAddresses: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: { addresses: Address[] };
    }>("/addresses");
    return response.data.data.addresses;
  },

  createAddress: async (payload: AddressPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { address: Address };
    }>("/addresses", payload);
    return response.data.data.address;
  },

  updateAddress: async (id: string, payload: Partial<AddressPayload>) => {
    const response = await apiClient.put<{
      success: boolean;
      data: { address: Address };
    }>(`/addresses/${id}`, payload);
    return response.data.data.address;
  },

  deleteAddress: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/addresses/${id}`);
    return response.data;
  },

  setDefaultAddress: async (id: string) => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { address: Address };
    }>(`/addresses/${id}/default`);
    return response.data.data.address;
  },
};
