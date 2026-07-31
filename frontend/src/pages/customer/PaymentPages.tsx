import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/DisplayComponents";
import { paymentService } from "@/services/payment.service";

export const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePayNow = async () => {
    if (!orderId) return;
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // Initiate payment via backend API
      const initRes = await paymentService.initiatePayment({ orderId, provider: "RAZORPAY" });

      // Simulate Razorpay SDK verification completion
      const verifyRes = await paymentService.verifyPayment({
        paymentId: initRes.paymentId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpayOrderId: initRes.providerOrderId,
        razorpaySignature: "mock_signature_valid",
      });

      if (verifyRes.isVerified) {
        navigate(`/order/success/${orderId}`);
      } else {
        navigate(`/order/failure/${orderId}`);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error?.message || "Payment initiation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-16 max-w-xl mx-auto space-y-6">
      <Card className="text-center space-y-6 bg-white shadow-xl">
        <CreditCard className="h-16 w-16 text-[#E67E22] mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#2C1E16]">Complete Order Payment</h1>
          <p className="text-xs text-[#6E5D4F]">Secure Razorpay Payment Gateway Integration</p>
        </div>

        {errorMsg ? (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
            {errorMsg}
          </div>
        ) : null}

        <Button onClick={handlePayNow} isLoading={isProcessing} className="w-full h-12 shadow-md">
          <span>Pay Now via Razorpay</span>
        </Button>

        <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" />
          <span>256-Bit Encrypted Secure Razorpay Gateway</span>
        </p>
      </Card>
    </div>
  );
};

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="py-16 max-w-xl mx-auto text-center space-y-6 bg-white border border-[#E8E2D9] rounded-3xl p-10 shadow-lg">
      <CheckCircle className="h-16 w-16 text-[#27AE60] mx-auto animate-in zoom-in" />
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#2C1E16]">Payment Successful!</h1>
        <p className="text-sm text-[#6E5D4F]">Thank you for your order. Our master bakers are preparing your items.</p>
        {orderId ? <p className="text-xs font-mono text-[#E67E22]">Order Reference: #{orderId}</p> : null}
      </div>

      <div className="pt-4 flex justify-center gap-4">
        <Link to="/customer/orders">
          <Button variant="outline">View Order History</Button>
        </Link>
        <Link to="/products">
          <Button>Back to Catalog</Button>
        </Link>
      </div>
    </div>
  );
};

export const OrderFailurePage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="py-16 max-w-xl mx-auto text-center space-y-6 bg-white border border-red-100 rounded-3xl p-10 shadow-lg">
      <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[#2C1E16]">Payment Failed</h1>
        <p className="text-sm text-[#6E5D4F]">
          Your payment could not be processed. Don't worry, your order items remain saved.
        </p>
      </div>

      <div className="pt-4 flex justify-center gap-4">
        {orderId ? (
          <Link to={`/payment/${orderId}`}>
            <Button className="bg-[#E67E22] hover:bg-[#D35400]">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              <span>Retry Payment</span>
            </Button>
          </Link>
        ) : null}
        <Link to="/cart">
          <Button variant="outline">Return to Cart</Button>
        </Link>
      </div>
    </div>
  );
};
