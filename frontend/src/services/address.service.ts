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

const LOCAL_ADDRESSES_KEY = "theonlinebakery_local_addresses";

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
        return response.data.data.address;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getLocalAddresses();
    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      district: payload.district,
      village: payload.village,
      street: payload.street,
      city: payload.city || "City",
      state: payload.state || "State",
      pincode: payload.pincode,
      landmark: payload.landmark,
      addressType: payload.addressType || "HOME",
      isDefault: payload.isDefault || current.length === 0,
    };

    if (newAddr.isDefault) {
      current.forEach((a) => (a.isDefault = false));
    }

    current.unshift(newAddr);
    saveLocalAddresses(current);
    return newAddr;
  },

  updateAddress: async (id: string, payload: Partial<AddressPayload>): Promise<Address> => {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: { address: Address };
      }>(`/addresses/${id}`, payload);
      if (response.data?.data?.address) {
        return response.data.data.address;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getLocalAddresses();
    const idx = current.findIndex((a) => a.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...payload };
      saveLocalAddresses(current);
      return current[idx];
    }
    return getLocalAddresses()[0];
  },

  deleteAddress: async (id: string) => {
    try {
      await apiClient.delete<{ success: boolean }>(`/addresses/${id}`);
    } catch (_err) {
      // Ignore
    }
    const current = getLocalAddresses().filter((a) => a.id !== id);
    saveLocalAddresses(current);
    return { success: true };
  },

  setDefaultAddress: async (id: string): Promise<Address> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { address: Address };
      }>(`/addresses/${id}/default`);
      if (response.data?.data?.address) {
        return response.data.data.address;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getLocalAddresses();
    current.forEach((a) => (a.isDefault = a.id === id));
    saveLocalAddresses(current);
    return current.find((a) => a.id === id) || current[0];
  },
};
