import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { useAuth } from "@/contexts/auth.context";
import { authService } from "@/services/auth.service";

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

  const navigate = useNavigate();
  const { login } = useAuth();

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const handleSendOtp = async (data: PhoneFormData) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await authService.sendOtp({ phone: data.phone, purpose: "login" });
      setPhone(data.phone);
      setStep("otp");
    } catch (err: any) {
      if (import.meta.env.DEV && data.phone === "9999999999") {
        setPhone("9999999999");
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
        navigate("/customer/profile", { replace: true });
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
          <span>Development Mode Quick Admin Access</span>
        </div>
        <p className="text-[11px] text-[#6E5D4F]">
          Mobile: <code className="font-bold text-[#2C1E16]">9999999999</code> &bull; OTP: <code className="font-bold text-[#2C1E16]">123456</code>
        </p>
        <button
          type="button"
          onClick={handleQuickDevAdmin}
          className="text-[11px] font-bold text-[#E67E22] underline hover:text-[#D35400]"
        >
          Auto-fill Admin Credentials
        </button>
      </div>

      {step === "phone" ? (
        <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-[#2C1E16]">Welcome to OneBite</h2>
            <p className="text-xs text-[#6E5D4F]">Enter your mobile number to receive a verification OTP.</p>
          </div>

          {apiError ? (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
              {apiError}
            </div>
          ) : null}

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
            <span>Secure 1-step OTP login. No password required.</span>
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
              className="text-[#E67E22] font-semibold hover:underline"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
