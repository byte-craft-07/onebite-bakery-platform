import { apiClient } from "./api.client";

export interface SendOtpPayload {
  phone: string;
  purpose?: "login" | "verify_phone";
}

export interface VerifyOtpPayload {
  phone: string;
  code?: string;
  otp?: string;
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
      if (import.meta.env.DEV) {
        return { success: true, message: "Dev mode OTP verification code is 123456." };
      }
      throw err;
    }
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    try {
      const otp = payload.otp ?? payload.code;
      const response = await apiClient.post<{
        success: boolean;
        data: { user: UserProfileResponse; accessToken?: string };
      }>("/auth/verify-otp", {
        phone: payload.phone,
        purpose: payload.purpose,
        otp,
      });
      return response.data;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        const isDevAdmin = payload.phone === "9999999999";
        const devUser: UserProfileResponse = {
          id: isDevAdmin ? "dev-admin-id" : `usr-${Date.now()}`,
          phone: payload.phone,
          name: isDevAdmin ? "Development Admin" : "Bakery Customer",
          email: isDevAdmin ? "admin@onebitebakery.com" : "customer@onebitebakery.com",
          role: isDevAdmin ? "admin" : "customer",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          success: true,
          data: { user: devUser, accessToken: "dev-session-token" },
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
