import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Cake, Loader2 } from "lucide-react";

import { useAuth } from "@/contexts/auth.context";
import { authService } from "@/services/auth.service";

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const error = searchParams.get("error");
      if (error) {
        navigate(`/auth/login?error=${encodeURIComponent(error)}`, { replace: true });
        return;
      }

      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const targetRedirect = searchParams.get("redirect");

      if (!token) {
        navigate("/auth/login?error=google_failed", { replace: true });
        return;
      }

      try {
        // Save tokens immediately so apiClient interceptor picks them up
        localStorage.setItem("onebitebakery_token", token);
        if (refreshToken) {
          localStorage.setItem("onebitebakery_refresh_token", refreshToken);
        }

        // Clean up URL query parameters so tokens don't persist in browser history
        if (typeof window !== "undefined" && window.history?.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Fetch fresh user profile
        const user = await authService.getCurrentUser();
        if (user) {
          login(user, {
            accessToken: token,
            refreshToken: refreshToken || undefined,
          });

          // Determine destination based on role and targetRedirect
          let destination = targetRedirect && targetRedirect.startsWith("/") ? targetRedirect : "";
          if (!destination || destination === "/auth/login" || destination === "/auth") {
            if (user.role === "admin") {
              destination = "/admin/dashboard";
            } else if (user.role === "branch_admin") {
              destination = "/admin/branch/dashboard";
            } else if (user.role === "delivery_agent") {
              destination = "/agent/dashboard";
            } else {
              destination = "/customer/dashboard";
            }
          }

          navigate(destination, { replace: true });
        } else {
          setErrorMsg("Could not verify user account. Please try signing in again.");
          setTimeout(() => {
            navigate("/auth/login?error=google_failed", { replace: true });
          }, 2000);
        }
      } catch (_err) {
        setErrorMsg("Authentication session could not be established. Redirecting to login...");
        setTimeout(() => {
          navigate("/auth/login?error=google_failed", { replace: true });
        }, 2000);
      }
    };

    void processCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 text-white">
      <div className="flex flex-col items-center gap-4 bg-[#1e1e1e] border border-[#2e2e2e] p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Cake className="h-7 w-7 animate-bounce" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">One Bite Bakery</h2>
          <p className="text-xs text-[#A0A0A0] mt-1">
            {errorMsg ? errorMsg : "Completing secure sign-in..."}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
