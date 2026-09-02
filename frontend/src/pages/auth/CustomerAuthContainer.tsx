import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, X } from "lucide-react";

import { useAuth } from "@/contexts/auth.context";
import { authService } from "@/services/auth.service";
import { googleAuthService } from "@/services/googleAuth.service";
import { getAvatarFromEmailOrName } from "@/components/common/UserAvatar";

const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "Verification OTP code must be 6 digits."),
});

type OtpFormData = z.infer<typeof otpSchema>;

export const CustomerAuthContainer: React.FC = () => {
  const [step, setStep] = useState<"initial" | "phone" | "otp" | "password">("initial");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, refreshSession } = useAuth();

  useEffect(() => {
    googleAuthService.loadGoogleScript().catch(() => null);

    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      sessionStorage.setItem("theonlinebakery_auth_redirect", redirectParam);
    }

    const errorParam = searchParams.get("error");
    if (errorParam === "google_cancelled") {
      setApiError("Google authentication was cancelled.");
    } else if (errorParam === "google_failed") {
      setApiError("Google Sign-In failed. Please try mobile OTP login.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setApiError(null);
    googleAuthService.redirectToGoogleOAuth();
  };

  const startCooldown = (seconds = 30) => {
    setCooldown(seconds);
  };

  const sendOtpForPhone = async (phoneNumber: string) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await authService.sendOtp({ phone: phoneNumber, purpose: "login" });
      setPhone(phoneNumber);
      if (import.meta.env.DEV) {
        otpForm.setValue("code", "123456");
      }
      setStep("otp");
      startCooldown(30);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        setPhone(phoneNumber);
        otpForm.setValue("code", "123456");
        setStep("otp");
        startCooldown(30);
      } else {
        setApiError(
          err?.response?.data?.message ||
            err?.response?.data?.error?.message ||
            "Failed to send OTP code. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueInitial = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = emailOrPhone.trim();
    if (!cleanInput) {
      setApiError("Please enter your email or 10-digit mobile number.");
      return;
    }

    setApiError(null);

    // If input is purely digits or 10 digits -> treat as Phone OTP login
    const digitsOnly = cleanInput.replace(/\D/g, "");
    if (/^[6-9]\d{9}$/.test(digitsOnly) || digitsOnly.length === 10) {
      await sendOtpForPhone(digitsOnly);
      return;
    }

    // If input contains @ or letters -> treat as Admin / Password login
    if (cleanInput.includes("@") || /[a-zA-Z]/.test(cleanInput)) {
      setStep("password");
      return;
    }

    setApiError("Please enter a valid 10-digit Indian phone number or email address.");
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !phone) return;
    setApiError(null);
    setIsSubmitting(true);
    try {
      await authService.sendOtp({ phone, purpose: "login" });
      if (import.meta.env.DEV) {
        otpForm.setValue("code", "123456");
      }
      startCooldown(30);
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Failed to resend OTP. Please wait before retrying.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const res = await authService.verifyOtp({
        phone,
        code: data.code,
        purpose: "login",
      });
      const userWithAvatar = {
        ...res.data.user,
        profileImage:
          res.data.user.profileImage ||
          (res.data.user.email || res.data.user.name
            ? getAvatarFromEmailOrName(res.data.user.name, res.data.user.email)
            : undefined),
      };
      localStorage.setItem("theonlinebakery_open_location_after_login", "true");
      login(userWithAvatar);

      const rawRedirect = searchParams.get("redirect") || sessionStorage.getItem("theonlinebakery_auth_redirect");
      const redirectUrl = rawRedirect ? (rawRedirect.startsWith("%") ? decodeURIComponent(rawRedirect) : rawRedirect) : "/checkout";
      sessionStorage.removeItem("theonlinebakery_auth_redirect");

      if (res.data.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (res.data.user.role === "branch_admin") {
        navigate("/admin/branch/dashboard", { replace: true });
      } else if (res.data.user.role === "delivery_agent") {
        navigate("/agent/dashboard", { replace: true });
      } else {
        navigate(redirectUrl, { replace: true });
      }
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Invalid or expired OTP code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password) {
      setApiError("Please enter email/phone and password.");
      return;
    }
    setIsSubmitting(true);
    setApiError(null);
    try {
      const user = await authService.loginWithPassword(emailOrPhone.trim(), password);
      const userWithAvatar = {
        ...user,
        profileImage:
          user.profileImage ||
          (user.email || user.name
            ? getAvatarFromEmailOrName(user.name, user.email)
            : undefined),
      };
      localStorage.setItem("theonlinebakery_open_location_after_login", "true");
      login(userWithAvatar);

      const rawRedirect = searchParams.get("redirect") || sessionStorage.getItem("theonlinebakery_auth_redirect");
      const redirectUrl = rawRedirect ? (rawRedirect.startsWith("%") ? decodeURIComponent(rawRedirect) : rawRedirect) : "/checkout";
      sessionStorage.removeItem("theonlinebakery_auth_redirect");

      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "branch_admin") {
        navigate("/admin/branch/dashboard", { replace: true });
      } else if (user.role === "delivery_agent") {
        navigate("/agent/dashboard", { replace: true });
      } else {
        navigate(redirectUrl, { replace: true });
      }
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Invalid login credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const formatMaskedPhone = (num: string) => {
    if (!num || num.length < 10) return num;
    return `+91 ${num.slice(0, 5)} ${"*".repeat(5)}`;
  };

  return (
    <div className="w-full bg-[#212121] border border-[#333333] rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-2xl relative">
      {/* Header with Title and Close button */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {step === "otp"
              ? "Enter OTP Code"
              : step === "phone"
              ? "Continue with phone"
              : step === "password"
              ? "Staff & Admin Login"
              : "Log in or sign up"}
          </h1>
          <p className="text-xs sm:text-sm text-[#B4B4B4] mt-1.5 leading-relaxed">
            {step === "otp"
              ? `Verification code sent to ${formatMaskedPhone(phone)}`
              : step === "phone"
              ? "Enter your mobile number to receive a 6-digit verification code."
              : step === "password"
              ? "Sign in with your Email/Phone and Password configured by Main Admin."
              : "Order fresh artisanal cakes, pastries & manage your orders."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (step !== "initial") {
              setStep("initial");
              setApiError(null);
            } else {
              navigate("/");
            }
          }}
          className="p-1.5 rounded-full text-[#8E8E8E] hover:text-white hover:bg-[#2F2F2F] transition-colors cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {apiError ? (
        <div className="mb-5 p-3.5 bg-red-950/50 border border-red-800/80 text-red-300 text-xs font-semibold rounded-2xl">
          {apiError}
        </div>
      ) : null}

      {/* Step 1: Initial Login Screen */}
      {step === "initial" ? (
        <div className="space-y-3.5">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full h-12 rounded-full bg-[#2F2F2F] hover:bg-[#383838] border border-[#3E3E3E] text-white text-sm font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
            <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          {/* Continue with Phone */}
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setApiError(null);
            }}
            className="w-full h-12 rounded-full bg-[#2F2F2F] hover:bg-[#383838] border border-[#3E3E3E] text-white text-sm font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer"
          >
            <Phone className="h-4 w-4 text-white shrink-0" />
            <span>Continue with phone</span>
          </button>

          {/* OR Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3E3E3E]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#212121] px-3 text-[#8E8E8E] font-semibold tracking-wider">OR</span>
            </div>
          </div>

          {/* Email / Phone Input and Continue Form */}
          <form onSubmit={handleContinueInitial} className="space-y-3.5">
            <input
              id="auth-login-input"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="Enter your email or phone number"
              className="w-full h-12 px-5 rounded-full bg-[#2F2F2F] border border-[#3E3E3E] text-white placeholder-[#8E8E8E] text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />

            <button
              type="submit"
              disabled={isSubmitting || !emailOrPhone.trim()}
              className="w-full h-12 rounded-full bg-white hover:bg-[#E5E5E5] text-black text-sm font-bold flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <span>{isSubmitting ? "Processing..." : "Continue"}</span>
            </button>
          </form>
        </div>
      ) : null}

      {/* Step: Dedicated Phone Login */}
      {step === "phone" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const clean = phone.replace(/\D/g, "");
            if (clean.length === 10) {
              sendOtpForPhone(clean);
            } else {
              setApiError("Please enter a valid 10-digit mobile number.");
            }
          }}
          className="space-y-4 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <div className="h-12 px-4 rounded-full bg-[#2F2F2F] border border-[#3E3E3E] text-white flex items-center justify-center font-bold text-sm shrink-0">
              🇮🇳 +91
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter 10-digit number"
              maxLength={10}
              className="flex-1 h-12 px-5 rounded-full bg-[#2F2F2F] border border-[#3E3E3E] text-white placeholder-[#8E8E8E] text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-medium"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || phone.replace(/\D/g, "").length < 10}
            className="w-full h-12 rounded-full bg-white hover:bg-[#E5E5E5] text-black text-sm font-bold flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{isSubmitting ? "Sending OTP..." : "Send Verification Code"}</span>
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("initial");
                setApiError(null);
              }}
              className="text-xs text-[#B4B4B4] hover:text-white underline cursor-pointer"
            >
              &larr; Back to all login options
            </button>
          </div>
        </form>
      ) : null}

      {/* Step 2: OTP Verification Screen */}
      {step === "otp" ? (
        <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4 animate-in fade-in">
          <input
            type="text"
            maxLength={6}
            placeholder="123456"
            {...otpForm.register("code")}
            className="w-full h-12 px-5 rounded-full bg-[#2F2F2F] border border-[#3E3E3E] text-white placeholder-[#8E8E8E] text-center tracking-[0.3em] font-bold text-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
          />
          {otpForm.formState.errors.code?.message ? (
            <p className="text-xs text-red-400 text-center">{otpForm.formState.errors.code.message}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-full bg-white hover:bg-[#E5E5E5] text-black text-sm font-bold flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{isSubmitting ? "Verifying..." : "Verify & Continue"}</span>
          </button>

          <div className="flex justify-between items-center text-xs pt-1 px-1">
            <button
              type="button"
              onClick={() => {
                setStep("initial");
                setApiError(null);
              }}
              className="text-[#B4B4B4] hover:text-white underline cursor-pointer"
            >
              &larr; Change Phone
            </button>

            <button
              type="button"
              disabled={cooldown > 0 || isSubmitting}
              onClick={handleResendOtp}
              className="text-[#596B58] font-semibold hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Step 3: Branch Admin / Staff Password Screen */}
      {step === "password" ? (
        <form onSubmit={handlePasswordLogin} className="space-y-3.5 animate-in fade-in">
          <input
            type="text"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            placeholder="Email or Phone Number"
            className="w-full h-12 px-5 rounded-full bg-[#2F2F2F] border border-[#3E3E3E] text-white placeholder-[#8E8E8E] text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full h-12 px-5 rounded-full bg-[#2F2F2F] border border-[#3E3E3E] text-white placeholder-[#8E8E8E] text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-full bg-white hover:bg-[#E5E5E5] text-black text-sm font-bold flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{isSubmitting ? "Logging in..." : "Log In as Branch Admin"}</span>
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("initial");
                setApiError(null);
              }}
              className="text-xs text-[#B4B4B4] hover:text-white underline cursor-pointer"
            >
              &larr; Back to Customer Login
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
};
