import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldCheck, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/DisplayComponents";
import { RazorpayCheckoutButton } from "@/components/payment/RazorpayCheckoutButton";

export const RazorpayDemoPage: React.FC = () => {
  const [amountRupees, setAmountRupees] = useState(100);
  const [lastPayment, setLastPayment] = useState<{
    order_id: string;
    payment_id: string;
    signature: string;
    verified: boolean;
  } | null>(null);

  return (
    <div className="py-12 max-w-2xl mx-auto px-4 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Home</span>
      </Link>

      <Card className="space-y-6 bg-white shadow-xl p-6 sm:p-8 rounded-3xl border border-[#E5DEC9]">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] flex items-center justify-center text-[#596B58] mx-auto shadow-xs">
            <ShoppingCart className="h-7 w-7 text-[#596B58]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">
            Razorpay Standard Checkout
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6E65]">
            Test live/test integration with order creation, modal popup &amp; signature verification.
          </p>
        </div>

        <div className="space-y-4 bg-[#FFF8EC]/60 p-5 rounded-2xl border border-[#E5DEC9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-bold text-[#3B302B]">Payment Amount (INR):</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#596B58]">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amountRupees}
                onChange={(e) => setAmountRupees(Math.max(1, Number(e.target.value)))}
                className="w-28 px-3 py-1.5 text-sm font-bold border border-[#E5DEC9] rounded-xl bg-white focus:outline-none focus:border-[#596B58]"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#7A6E65]">
            Equivalent in paise: <strong>{amountRupees * 100} paise</strong> (Minimum required by Razorpay: 100 paise = ₹1.00).
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <RazorpayCheckoutButton
            amount={amountRupees}
            isAmountInPaise={false}
            currency="INR"
            receipt={`demo_rcpt_${Date.now()}`}
            customerName="John Doe"
            customerEmail="test@example.com"
            customerPhone="9876543210"
            buttonText={`Pay ₹${amountRupees} with Razorpay`}
            className="w-full sm:w-auto min-w-[240px] text-sm py-3.5"
            onSuccess={(res) => {
              setLastPayment({
                order_id: res.razorpay_order_id,
                payment_id: res.razorpay_payment_id,
                signature: res.razorpay_signature,
                verified: res.verified,
              });
            }}
          />

          <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" />
            <span>Secured with Razorpay Standard Checkout &amp; HMAC-SHA256 signature verification.</span>
          </p>
        </div>

        {lastPayment && (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-green-800 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Payment Verified &amp; Confirmed!</span>
            </div>
            <div className="font-mono text-[11px] text-green-900 space-y-1 bg-white p-3 rounded-xl border border-green-100">
              <p><strong>Razorpay Order ID:</strong> {lastPayment.order_id}</p>
              <p><strong>Razorpay Payment ID:</strong> {lastPayment.payment_id}</p>
              <p className="break-all"><strong>Signature:</strong> {lastPayment.signature}</p>
              <p><strong>Verification Status:</strong> {lastPayment.verified ? "VERIFIED (MATCH)" : "UNVERIFIED"}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
