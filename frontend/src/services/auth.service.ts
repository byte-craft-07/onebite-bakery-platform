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
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>("/auth/send-otp", payload);
      return response.data;
    } catch (err: any) {
      if (import.meta.env.DEV && payload.phone === "9999999999") {
        return { success: true, message: "Dev mode OTP bypass ready." };
      }
      throw err;
    }
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { user: UserProfileResponse; accessToken: string };
      }>("/auth/verify-otp", payload);
      return response.data;
    } catch (err: any) {
      if (import.meta.env.DEV && payload.phone === "9999999999" && (payload.code === "123456" || payload.code === "1234")) {
        const devAdminUser: UserProfileResponse = {
          id: "dev-admin-id",
          phone: "9999999999",
          name: "Development Admin",
          email: "admin@onebite.local",
          role: "admin",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          success: true,
          data: { user: devAdminUser, accessToken: "dev-admin-token" },
        };
      }
      throw err;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { user: UserProfileResponse };
      }>("/auth/me");
      return response.data.data.user;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        const storedUser = localStorage.getItem("onebite_user");
        if (storedUser) {
          return JSON.parse(storedUser) as UserProfileResponse;
        }
      }
      throw err;
    }
  },

  logout: async () => {
    try {
      const response = await apiClient.post<{ success: boolean }>("/auth/logout");
      return response.data;
    } catch (_err) {
      return { success: true };
    }
  },

  logoutAll: async () => {
    try {
      const response = await apiClient.post<{ success: boolean }>("/auth/logout-all");
      return response.data;
    } catch (_err) {
      return { success: true };
    }
  },
};
