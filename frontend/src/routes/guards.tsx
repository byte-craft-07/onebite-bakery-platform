import React from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";

import { useAuth } from "@/contexts/auth.context";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-semibold text-[#7A6E65]">Loading authentication...</div>;
  }

  const redirectPath = encodeURIComponent(location.pathname + location.search);
  return isAuthenticated ? <Outlet /> : <Navigate to={`/auth/login?redirect=${redirectPath}`} replace />;
};

export const GuestRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-semibold text-[#7A6E65]">Loading...</div>;
  }

  if (isAuthenticated && user) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === "branch_admin") {
      return <Navigate to="/admin/branch/dashboard" replace />;
    }
    if (user.role === "delivery_agent") {
      return <Navigate to="/agent/dashboard" replace />;
    }
    const rawRedirect = searchParams.get("redirect") || sessionStorage.getItem("theonlinebakery_auth_redirect");
    const redirect = rawRedirect ? (rawRedirect.startsWith("%") ? decodeURIComponent(rawRedirect) : rawRedirect) : "/checkout";
    sessionStorage.removeItem("theonlinebakery_auth_redirect");
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-semibold text-[#7A6E65]">Loading admin credentials...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return role === "admin" || role === "branch_admin" ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};
