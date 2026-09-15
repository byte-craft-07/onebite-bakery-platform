import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2, RefreshCw, ShieldCheck, X } from "lucide-react";

import { useAuth } from "@/contexts/auth.context";
import { googleAuthService } from "@/services/googleAuth.service";

export const CustomerAuthContainer: React.FC = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Preload Google Identity Services SDK in background
    googleAuthService.loadGoogleScript().catch(() => null);

    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      sessionStorage.setItem("theonlinebakery_auth_redirect", redirectParam);
    }

    const errorParam = searchParams.get("error");
    if (errorParam === "google_cancelled") {
      setApiError("Google authentication was cancelled. Please try again.");
    } else if (errorParam === "google_failed") {
      setApiError("Google Sign-In failed. Please click below to try again.");
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    try {
      setIsGoogleLoading(true);
      setApiError(null);
      // Trigger Google OAuth flow
      googleAuthService.redirectToGoogleOAuth();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google Sign-In failed. Please try again.";
      setApiError(message);
      setIsGoogleLoading(false);
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

      {/* Primary Login: Continue with Google */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
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
      </div>

      {/* Footer Security Badge */}
      <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex items-center justify-center gap-2 text-[11px] text-[#7E7E7E]">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span>256-Bit Encrypted & Secure Authentication</span>
      </div>
    </div>
  );
};



