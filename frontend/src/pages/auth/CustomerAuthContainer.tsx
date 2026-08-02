import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { useAuth } from "@/contexts/auth.context";
import { authService } from "@/services/auth.service";
import { googleAuthService } from "@/services/googleAuth.service";

const phoneSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number."),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

const otpSchema = z.object({
  code: z.string().trim().length(6, "Verification OTP code must be 6 digits."),
});

type OtpFormData = z.infer<typeof otpSchema>;

export const CustomerAuthContainer: React.FC = () => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    googleAuthService.loadGoogleScript().catch(() => null);
  }, []);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setApiError(null);
    try {
      const res = await googleAuthService.loginWithGoogleToken("simulated-google-id-token");
      login(res.user as any);
      navigate("/customer/dashboard", { replace: true });
    } catch (_err) {
      setApiError("Google Sign-In failed. Please try mobile OTP login.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendOtp = async (data: PhoneFormData) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await authService.sendOtp({ phone: data.phone, purpose: "login" });
      setPhone(data.phone);
      if (import.meta.env.DEV) {
        otpForm.setValue("code", "123456");
      }
      setStep("otp");
    } catch (err: any) {
      if (import.meta.env.DEV) {
        setPhone(data.phone);
        otpForm.setValue("code", "123456");
        setStep("otp");
      } else {
        setApiError(err?.response?.data?.error?.message || "Failed to send OTP code. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const res = await authService.verifyOtp({ phone, code: data.code, purpose: "login" });
      login(res.data.user);
      if (res.data.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/customer/dashboard", { replace: true });
      }
    } catch (err: any) {
      setApiError(err?.response?.data?.error?.message || "Invalid or expired OTP code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDevAdmin = () => {
    phoneForm.setValue("phone", "9999999999");
    otpForm.setValue("code", "123456");
    setPhone("9999999999");
    setStep("otp");
  };

  return (
    <div className="space-y-6">
      {/* Dev Mode Admin Shortcut Banner */}
      <div className="p-3 bg-[#FFF3E6] border border-[#E67E22]/30 rounded-xl text-center space-y-1.5">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#E67E22]">
          <UserCheck className="h-4 w-4" />
          <span>Development Mode Quick Access</span>
        </div>
        <p className="text-[11px] text-[#6E5D4F]">
          Any Phone (e.g. <code className="font-bold text-[#2C1E16]">9876543210</code>) or Admin <code className="font-bold text-[#2C1E16]">9999999999</code> &bull; OTP: <code className="font-bold text-[#2C1E16]">123456</code>
        </p>
        <button
          type="button"
          onClick={handleQuickDevAdmin}
          className="text-[11px] font-bold text-[#E67E22] underline hover:text-[#D35400] cursor-pointer"
        >
          Auto-fill Admin Credentials
        </button>
      </div>

      {step === "phone" ? (
        <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-[#2C1E16]">Welcome to OneBite</h2>
            <p className="text-xs text-[#6E5D4F]">Sign in using your Google Account or mobile OTP.</p>
          </div>

          {apiError ? (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
              {apiError}
            </div>
          ) : null}

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full h-11 px-4 rounded-xl border border-[#E8E2D9] bg-white text-[#2C1E16] text-xs font-bold flex items-center justify-center gap-3 shadow-xs hover:bg-[#FFFBF5] hover:border-[#E67E22] transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E2D9]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#FFFBF5] px-3 text-[#9C8C7E] font-medium">or login via Mobile OTP</span>
            </div>
          </div>

          <Input
            label="Mobile Number"
            placeholder="9876543210"
            {...phoneForm.register("phone")}
            error={phoneForm.formState.errors.phone?.message}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            <span>Send Verification OTP</span>
          </Button>

          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" />
            <span>Secure Google OAuth & 1-step OTP login.</span>
          </p>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4 animate-in fade-in">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-[#2C1E16]">Verify OTP Code</h2>
            <p className="text-xs text-[#6E5D4F]">
              Enter the 6-digit code sent to <strong className="text-[#2C1E16]">+91 {phone}</strong>
            </p>
          </div>

          {apiError ? (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
              {apiError}
            </div>
          ) : null}

          <Input
            label="6-Digit Verification Code"
            placeholder="123456"
            maxLength={6}
            {...otpForm.register("code")}
            error={otpForm.formState.errors.code?.message}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            <span>Verify & Proceed</span>
          </Button>

          <div className="flex justify-between items-center text-xs pt-2">
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="text-[#6E5D4F] hover:underline"
            >
              Change Phone Number
            </button>

            <button
              type="button"
              onClick={() => handleSendOtp({ phone })}
              className="text-[#E67E22] font-semibold hover:underline cursor-pointer"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
