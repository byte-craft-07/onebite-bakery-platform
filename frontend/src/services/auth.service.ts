import { apiClient } from "./api.client";

export interface CustomerLocationResponse {
  villageId: string;
  villageName: string;
  district: string;
  pincode: string;
}

export interface UserProfileResponse {
  id: string;
  phone?: string;
  name?: string;
  email?: string;
  role: "customer" | "admin" | "branch_admin" | "delivery_agent";
  branchId?: string;
  currentLocation?: CustomerLocationResponse;
  profileImage?: string;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const authService = {
  loginWithPassword: async (identifier: string, password: string): Promise<{ user: UserProfileResponse; tokens?: { accessToken?: string; refreshToken?: string } }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        user: UserProfileResponse;
        tokens?: { accessToken?: string; refreshToken?: string };
      };
    }>("/auth/login-password", {
      identifier: identifier.trim(),
      password,
    });
    const { user, tokens } = response.data.data;
    if (tokens?.accessToken) {
      localStorage.setItem("onebitebakery_token", tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      localStorage.setItem("onebitebakery_refresh_token", tokens.refreshToken);
    }
    localStorage.setItem("onebitebakery_user", JSON.stringify(user));
    return { user, tokens };
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: { user: UserProfileResponse };
    }>("/auth/me");
    return response.data?.data?.user || null;
  },
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("onebitebakery_refresh_token");
      const response = await apiClient.post<{ success: boolean }>("/auth/logout", {
        refreshToken: refreshToken || undefined,
      });
      return response.data;
    } catch (_err) {
      return { success: true };
    } finally {
      localStorage.removeItem("onebitebakery_token");
      localStorage.removeItem("onebitebakery_refresh_token");
      localStorage.removeItem("onebitebakery_user");
    }
  },

  logoutAll: async () => {
    try {
      const response = await apiClient.post<{ success: boolean }>("/auth/logout-all");
      return response.data;
    } catch (_err) {
      return { success: true };
    } finally {
      localStorage.removeItem("onebitebakery_token");
      localStorage.removeItem("onebitebakery_refresh_token");
      localStorage.removeItem("onebitebakery_user");
    }
  },

  updateLocation: async (payload: { villageId: string; district: string }) => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        message?: string;
        data: { currentLocation: CustomerLocationResponse };
      }>("/users/location", payload);
      const loc = response.data.data.currentLocation;
      if (loc) {
        localStorage.setItem("onebitebakery_current_location", JSON.stringify(loc));
        localStorage.setItem("onebitebakery_active_location", JSON.stringify(loc));
        return loc;
      }
    } catch (_err) {
      // Graceful fallback for offline / unauthenticated session
    }

    const { villageService } = await import("./village.service");
    const villages = await villageService.getVillages(payload.district);
    const matched = villages.find((v) => v.id === payload.villageId);
    const fallbackLoc: CustomerLocationResponse = {
      villageId: payload.villageId,
      villageName: matched ? matched.name : "Selected Village",
      district: payload.district,
      pincode: matched ? matched.pincode : "781001",
    };
    localStorage.setItem("onebitebakery_current_location", JSON.stringify(fallbackLoc));
    localStorage.setItem("onebitebakery_active_location", JSON.stringify(fallbackLoc));
    return fallbackLoc;
  },

  getLocation: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: { currentLocation: CustomerLocationResponse | null };
    }>("/users/location");
    const loc = response.data.data.currentLocation;
    if (loc) {
      localStorage.setItem("onebitebakery_current_location", JSON.stringify(loc));
      localStorage.setItem("onebitebakery_active_location", JSON.stringify(loc));
    }
    return loc;
  },

  getStoredLocation: (): CustomerLocationResponse | null => {
    try {
      const activeRaw = localStorage.getItem("onebitebakery_active_location");
      if (activeRaw) return JSON.parse(activeRaw);
      const currentRaw = localStorage.getItem("onebitebakery_current_location");
      if (currentRaw) return JSON.parse(currentRaw);
      const userRaw = localStorage.getItem("onebitebakery_user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.currentLocation) return u.currentLocation;
      }
      return null;
    } catch (_err) {
      return null;
    }
  },
};
