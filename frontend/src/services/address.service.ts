import { apiClient } from "./api.client";

export interface Address {
  id: string;
  name: string;
  email?: string;
  phone: string;
  district?: string;
  village?: string;
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
  email?: string;
  phone: string;
  district?: string;
  village?: string;
  street: string;
  city?: string;
  state?: string;
  pincode: string;
  landmark?: string;
  addressType?: "HOME" | "WORK" | "OTHER";
  isDefault?: boolean;
}

const LOCAL_ADDRESSES_KEY = "onebitebakery_local_addresses";

const getLocalAddresses = (): Address[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ADDRESSES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_err) {
    // Ignore
  }
  return [];
};

const saveLocalAddresses = (list: Address[]) => {
  try {
    localStorage.setItem(LOCAL_ADDRESSES_KEY, JSON.stringify(list));
  } catch (_err) {
    // Ignore
  }
};

export const addressService = {
  getAddresses: async (): Promise<Address[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { addresses: Address[] };
      }>("/addresses");
      if (response.data?.data?.addresses) {
        return response.data.data.addresses;
      }
    } catch (_err) {
      return getLocalAddresses();
    }
    return [];
  },

  createAddress: async (payload: AddressPayload): Promise<Address> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { address: Address };
      }>("/addresses", payload);
      if (response.data?.data?.address) {
        const current = getLocalAddresses();
        if (response.data.data.address.isDefault) {
          current.forEach((a) => (a.isDefault = false));
        }
        current.unshift(response.data.data.address);
        saveLocalAddresses(current);
        return response.data.data.address;
      }
      throw new Error("Failed to create address");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to create address";
      throw new Error(msg);
    }
  },

  updateAddress: async (id: string, payload: Partial<AddressPayload>): Promise<Address> => {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: { address: Address };
      }>(`/addresses/${id}`, payload);
      if (response.data?.data?.address) {
        const current = getLocalAddresses();
        const idx = current.findIndex((a) => a.id === id);
        if (idx >= 0) {
          current[idx] = response.data.data.address;
        } else {
          current.push(response.data.data.address);
        }
        saveLocalAddresses(current);
        return response.data.data.address;
      }
      throw new Error("Failed to update address");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to update address";
      throw new Error(msg);
    }
  },

  deleteAddress: async (id: string) => {
    try {
      await apiClient.delete<{ success: boolean }>(`/addresses/${id}`);
      const current = getLocalAddresses().filter((a) => a.id !== id);
      saveLocalAddresses(current);
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete address";
      throw new Error(msg);
    }
  },

  setDefaultAddress: async (id: string): Promise<Address> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { address: Address };
      }>(`/addresses/${id}/default`);
      if (response.data?.data?.address) {
        const current = getLocalAddresses();
        current.forEach((a) => (a.isDefault = a.id === id));
        saveLocalAddresses(current);
        return response.data.data.address;
      }
      throw new Error("Failed to set default address");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to set default address";
      throw new Error(msg);
    }
  },
};
