import React, { createContext, useContext, useEffect, useState } from "react";

import { authService, type UserProfileResponse } from "@/services/auth.service";
import { PushNotificationService } from "@/services/pushNotification.service";

import type { CustomerLocationResponse } from "@/services/auth.service";

export interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: "customer" | "admin" | "branch_admin" | "delivery_agent" | null;
  currentLocation: CustomerLocationResponse | null;
  login: (user: UserProfileResponse) => void;
  updateUser: (partial: Partial<UserProfileResponse>) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateCurrentLocation: (villageId: string, district: string) => Promise<CustomerLocationResponse>;
  hasRole: (requiredRole: "customer" | "admin" | "branch_admin" | "delivery_agent") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_STORAGE_KEY = "theonlinebakery_user";
const LOCAL_LOCATION_KEY = "theonlinebakery_active_location";

import { getAvatarFromEmailOrName } from "@/components/common/UserAvatar";

const ADMIN_EMAILS = ["ajaykterha@gmail.com", "ajayterha@gmail.com"];
const ADMIN_PHONES = ["7897671632", "9999999999"];
export const AJAY_GOOGLE_PHOTO = "https://lh3.googleusercontent.com/a/ACg8ocKUbft27NKCgakV4you7xwWL4RqMom-n5LZNJ_eTUsfmzR6KlCLUQ=s96-c";

const normalizeUser = (u: UserProfileResponse | null): UserProfileResponse | null => {
  if (!u) return null;
  const normEmail = u.email?.trim().toLowerCase();
  const normPhone = u.phone?.replace(/\D/g, "").slice(-10);
  let updated = { ...u };
  const isAdmin = (normEmail && ADMIN_EMAILS.includes(normEmail)) || (normPhone && ADMIN_PHONES.includes(normPhone));
  if (isAdmin) {
    updated.role = "admin";
  }
  if (
    !updated.profileImage ||
    updated.profileImage.includes("unavatar.io") ||
    updated.profileImage.includes("ui-avatars.com") ||
    updated.profileImage.includes("ACg8ocL30hOcrEYenvWOYH5SoIw2PwYspA8zf3cp8iU-ZgyrvoX8gw")
  ) {
    if (isAdmin) {
      updated.profileImage = AJAY_GOOGLE_PHOTO;
    } else {
      updated.profileImage = undefined;
    }
  }
  return updated;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileResponse | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = normalizeUser(parsed);
        if (parsed?.profileImage && (parsed.profileImage.includes("unavatar") || parsed.profileImage.includes("ui-avatars"))) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
        }
        return normalized;
      }
    } catch (_err) {
      // Ignore
    }
    return null;
  });
  const [guestLocation, setGuestLocation] = useState<CustomerLocationResponse | null>(() => {
    try {
      const storedLoc = localStorage.getItem(LOCAL_LOCATION_KEY);
      if (storedLoc) return JSON.parse(storedLoc);
    } catch (_err) {
      // Ignore
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const normalized = normalizeUser(currentUser);
        setUser(normalized);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
        void PushNotificationService.autoSyncSubscriptionIfGranted();
        return;
      }
    } catch (_err) {
      // If server check fails (e.g. offline dev mode or cookie issue), preserve stored session if valid
      try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            const normalized = normalizeUser(parsed);
            setUser(normalized);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
            void PushNotificationService.autoSyncSubscriptionIfGranted();
            return;
          }
        }
      } catch (_parseErr) {
        // ignore
      }
      clearClientData();
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    refreshSession();
  }, []);

  const login = (sessionUser: UserProfileResponse) => {
    const normalized = normalizeUser(sessionUser);
    setUser(normalized);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));

      const isCheckoutPage =
        typeof window !== "undefined" &&
        window.location.pathname.includes("checkout");

      if (!sessionUser.currentLocation && !isCheckoutPage) {
        localStorage.setItem("theonlinebakery_open_location_after_login", "true");
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("theonlinebakery_open_location_modal"));
        }, 50);
      } else {
        localStorage.removeItem("theonlinebakery_open_location_after_login");
      }

      // Prompt push notification permission on login if supported and permission is default
      if (PushNotificationService.isSupported() && typeof Notification !== "undefined") {
        if (Notification.permission === "default") {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("theonlinebakery_prompt_push_permission"));
          }, 800);
        } else if (Notification.permission === "granted") {
          void PushNotificationService.autoSyncSubscriptionIfGranted();
        }
      }
    } catch (_err) {
      // Ignore
    }
  };

  const updateUser = (partial: Partial<UserProfileResponse>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = normalizeUser({ ...prev, ...partial });
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      } catch (_err) {
        // Ignore
      }
      return updated;
    });
  };

  const updateCurrentLocation = async (villageId: string, district: string): Promise<CustomerLocationResponse> => {
    try {
      const { cartService } = await import("@/services/cart.service");
      await cartService.clearCart();
    } catch (_cartErr) {
      // ignore
    }

    if (user) {
      const newLoc = await authService.updateLocation({ villageId, district });
      const updatedUser: UserProfileResponse = { ...user, currentLocation: newLoc };
      setUser(updatedUser);
      setGuestLocation(newLoc);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(LOCAL_LOCATION_KEY, JSON.stringify(newLoc));
      localStorage.setItem("theonlinebakery_current_location", JSON.stringify(newLoc));
      window.dispatchEvent(new CustomEvent("theonlinebakery_location_changed", { detail: newLoc }));
      return newLoc;
    } else {
      // Guest local location selection
      const { villageService } = await import("@/services/village.service");
      const villages = await villageService.getVillages(district);
      const matched = villages.find((v) => v.id === villageId);
      const guestLoc: CustomerLocationResponse = {
        villageId,
        villageName: matched ? matched.name : "Selected Village",
        district: district,
        pincode: matched ? matched.pincode : "781001",
      };
      setGuestLocation(guestLoc);
      localStorage.setItem(LOCAL_LOCATION_KEY, JSON.stringify(guestLoc));
      localStorage.setItem("theonlinebakery_current_location", JSON.stringify(guestLoc));
      window.dispatchEvent(new CustomEvent("theonlinebakery_location_changed", { detail: guestLoc }));
      return guestLoc;
    }
  };

  const clearClientData = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem("theonlinebakery_local_cart");
    localStorage.removeItem("theonlinebakery_customer_orders_list");
    localStorage.removeItem("theonlinebakery_local_addresses");
    localStorage.removeItem("theonlinebakery_local_celebrations");
    localStorage.removeItem("theonlinebakery_local_tickets");
    localStorage.removeItem("theonlinebakery_local_customer_notifs");
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (_err) {
      // Ignore API logout errors and clear client state
    } finally {
      clearClientData();
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch (_err) {
      // Ignore errors
    } finally {
      clearClientData();
    }
  };

  const hasRole = (requiredRole: "customer" | "admin" | "branch_admin" | "delivery_agent"): boolean => {
    return user?.role === requiredRole;
  };

  const activeLocation = user?.currentLocation ?? guestLocation;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role ?? null,
        currentLocation: activeLocation,
        login,
        updateUser,
        logout,
        logoutAll,
        refreshSession,
        updateCurrentLocation,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      role: null,
      currentLocation: null,
      login: () => {},
      updateUser: () => {},
      logout: async () => {},
      logoutAll: async () => {},
      refreshSession: async () => {},
      updateCurrentLocation: async () => ({
        villageId: "",
        villageName: "",
        district: "",
        pincode: "",
      }),
      hasRole: () => false,
    };
  }
  return context;
};
