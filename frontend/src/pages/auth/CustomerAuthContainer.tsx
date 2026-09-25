import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/auth.context";
import { authService } from "@/services/auth.service";
import { googleAuthService } from "@/services/googleAuth.service";

export const CustomerAuthContainer: React.FC = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      Boolean(import.meta.env.DEV));

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Preload Google Identity Services SDK in background
    googleAuthService.loadGoogleScript().catch(() => null);

    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      const refreshTokenParam = searchParams.get("refreshToken");
      const redirectParam = searchParams.get("redirect") || "/customer/dashboard";
      localStorage.setItem("onebitebakery_token", tokenParam);
      if (refreshTokenParam) {
        localStorage.setItem("onebitebakery_refresh_token", refreshTokenParam);
      }
      authService
        .getCurrentUser()
        .then((u) => {
          if (u) {
            login(u, {
              accessToken: tokenParam,
              refreshToken: refreshTokenParam || undefined,
            });
            navigate(redirectParam, { replace: true });
          }
        })
        .catch(() => null);
      return;
    }

    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      sessionStorage.setItem("onebitebakery_auth_redirect", redirectParam);
    }

    const errorParam = searchParams.get("error");
    if (errorParam === "google_cancelled") {
      setApiError("Google authentication was cancelled. Please try again.");
    } else if (errorParam === "google_invalid_state") {
      setApiError(
        "Google Sign-In verification expired or was invalid on localhost. Please use the Password / Test Login below.",
      );
    } else if (errorParam === "google_failed") {
      setApiError("Google Sign-In failed. Please click below to try again.");
    }
  }, [searchParams, login, navigate]);

  const getRedirectPath = (role?: string) => {
    const redirectParam =
      searchParams.get("redirect") ||
      (typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("onebitebakery_auth_redirect")
        : null);

    if (redirectParam && redirectParam !== "/auth/login") {
      return redirectParam;
    }

    if (role === "admin") return "/admin/dashboard";
    if (role === "branch_admin") return "/admin/branch/dashboard";
    if (role === "delivery_agent") return "/agent/dashboard";
    return "/customer/dashboard";
  };

  const handleGoogleLogin = () => {
    try {
      setIsGoogleLoading(true);
      setApiError(null);
      googleAuthService.redirectToGoogleOAuth();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google Sign-In failed. Please try again.";
      setApiError(message);
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setApiError("Please enter your Phone number or Email.");
      return;
    }
    if (!password) {
      setApiError("Please enter your password.");
      return;
    }

    try {
      setIsPasswordLoading(true);
      setApiError(null);

      const result = await authService.loginWithPassword(identifier, password);
      login(result.user, result.tokens);

      const destination = getRedirectPath(result.user.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : "Invalid phone/email or password.");
      setApiError(message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleQuickLogin = async (testId: string, testPass: string) => {
    setIdentifier(testId);
    setPassword(testPass);
    try {
      setIsPasswordLoading(true);
      setApiError(null);

      const result = await authService.loginWithPassword(testId, testPass);
      login(result.user, result.tokens);

      const destination = getRedirectPath(result.user.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : "Login failed. Please check credentials.");
      setApiError(message);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Log in or sign up
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1.5 leading-relaxed">
            Experience fresh artisanal bakery delicacies delivered to you.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="p-2 rounded-full text-[#8E8E8E] hover:text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-medium rounded-xl leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{apiError}</span>
            <div className="mt-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry Google Sign-In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Login Option 1: Continue with Google */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isPasswordLoading}
          className="w-full h-12 rounded-xl bg-white hover:bg-[#F2F2F2] text-black text-sm font-bold flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.01]"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-black" />
          ) : (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>
            {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#333333]"></div>
          <span className="flex-shrink mx-3 text-[11px] font-semibold tracking-wider text-[#737373] uppercase">
            OR SIGN IN WITH PASSWORD
          </span>
          <div className="flex-grow border-t border-[#333333]"></div>
        </div>

        {/* Option 2: Password Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#c0c0c0] mb-1.5">
              Phone Number or Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#777]">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 7897671632 or ajay@gmail.com"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#272727] border border-[#3b3b3b] text-white text-sm placeholder:text-[#666] focus:outline-none focus:border-amber-400/80 transition-colors"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c0c0c0] mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#777]">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#272727] border border-[#3b3b3b] text-white text-sm placeholder:text-[#666] focus:outline-none focus:border-amber-400/80 transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#777] hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPasswordLoading || isGoogleLoading}
            className="w-full h-11 rounded-xl bg-[#D4A373] hover:bg-[#c29160] text-black text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.01]"
          >
            {isPasswordLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <KeyRound className="h-4 w-4 text-black" />
            )}
            <span>{isPasswordLoading ? "Signing in..." : "Sign In with Password"}</span>
          </button>
        </form>

        {/* Quick Test / Development Logins - ONLY shown on localhost */}
        {isLocalhost && (
          <div className="pt-3 border-t border-[#2e2e2e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                1-Click Quick Test Login (Localhost Only)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("7897671632", "Admin@123")}
                disabled={isPasswordLoading || isGoogleLoading}
                className="p-2.5 rounded-xl bg-[#262626] hover:bg-[#323232] border border-[#3a3a3a] hover:border-amber-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-amber-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Admin Login</span>
                </div>
                <div className="text-[10px] text-[#8e8e8e] mt-0.5 truncate">
                  7897671632 (Full Access)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("9876543210", "Customer@123")}
                disabled={isPasswordLoading || isGoogleLoading}
                className="p-2.5 rounded-xl bg-[#262626] hover:bg-[#323232] border border-[#3a3a3a] hover:border-amber-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-amber-300">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Customer Login</span>
                </div>
                <div className="text-[10px] text-[#8e8e8e] mt-0.5 truncate">
                  9876543210 (Cart/Orders)
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Security Badge */}
      <div className="mt-5 pt-3.5 border-t border-[#2a2a2a] flex items-center justify-center gap-2 text-[11px] text-[#7E7E7E]">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span>256-Bit Encrypted & Secure Authentication</span>
      </div>
    </div>
  );
};

export default CustomerAuthContainer;
