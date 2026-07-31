import React, { createContext, useContext, useEffect, useState } from "react";

import { authService, type UserProfileResponse } from "@/services/auth.service";

export interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: "customer" | "admin" | null;
  login: (user: UserProfileResponse) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasRole: (requiredRole: "customer" | "admin") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (_err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = (sessionUser: UserProfileResponse) => {
    setUser(sessionUser);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (_err) {
      // Ignore API logout errors and clear client state
    } finally {
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch (_err) {
      // Ignore errors
    } finally {
      setUser(null);
    }
  };

  const hasRole = (requiredRole: "customer" | "admin"): boolean => {
    return user?.role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role ?? null,
        login,
        logout,
        logoutAll,
        refreshSession,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
