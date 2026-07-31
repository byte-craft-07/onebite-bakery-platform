import { apiClient } from "./api.client";

export interface SendOtpPayload {
  phone: string;
  purpose?: "login" | "verify_phone";
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
  purpose?: "login" | "verify_phone";
}

export interface UserProfileResponse {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: "customer" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  sendOtp: async (payload: SendOtpPayload) => {
    const response = await apiClient.post<{ success: boolean; message: string }>("/auth/send-otp", payload);
    return response.data;
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { user: UserProfileResponse; accessToken: string };
    }>("/auth/verify-otp", payload);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: { user: UserProfileResponse };
    }>("/auth/me");
    return response.data.data.user;
  },

  logout: async () => {
    const response = await apiClient.post<{ success: boolean }>("/auth/logout");
    return response.data;
  },

  logoutAll: async () => {
    const response = await apiClient.post<{ success: boolean }>("/auth/logout-all");
    return response.data;
  },
};
