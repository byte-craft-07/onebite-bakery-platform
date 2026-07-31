import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/contexts/auth.context";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-semibold text-[#6E5D4F]">Loading authentication...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-semibold text-[#6E5D4F]">Loading...</div>;
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-semibold text-[#6E5D4F]">Loading admin credentials...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return role === "admin" ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};
