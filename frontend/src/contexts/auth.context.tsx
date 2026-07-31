import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserSession {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  role: "customer" | "admin";
}

export interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: "customer" | "admin" | null;
  login: (user: UserSession) => void;
  logout: () => void;
  hasRole: (requiredRole: "customer" | "admin") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initial session verification foundation
    setIsLoading(false);
  }, []);

  const login = (sessionUser: UserSession) => {
    setUser(sessionUser);
  };

  const logout = () => {
    setUser(null);
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
