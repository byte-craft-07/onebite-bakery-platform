import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/DisplayComponents";
import { paymentService } from "@/services/payment.service";
import { orderService, type OrderDetails } from "@/services/order.service";
import { razorpayService } from "@/services/razorpay.service";
import { OrderReviewForm } from "./OrdersPages";

const getPaymentPageError = (error: unknown): string => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return data?.error?.message || data?.message || "Payment initiation failed. Please try again.";
  }

  return error instanceof Error
    ? error.message
    : "Payment initiation failed. Please try again.";
};

const waitForPaidOrder = async (orderId: string): Promise<OrderDetails> => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const order = await orderService.getOrderById(orderId);

    if (order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID") {
      return order;
    }

    if (order.paymentStatus === "FAILED" || order.paymentStatus === "CANCELLED") {
      throw new Error("UPI payment was not completed. Please retry.");
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error("Payment is still being verified. Please check your order status shortly.");
};

export const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handlePayNow = async () => {
    if (!orderId) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setIsProcessing(true);

    try {
      await orderService.getOrderById(orderId);
      const initRes = await paymentService.initiatePayment({ orderId, provider: "RAZORPAY" });

      setStatusMsg("Opening UPI payment...");
      await razorpayService.openPaymentModal({
        payment: initRes,
        customerName: "OneBite Customer",
        customerEmail: "customer@onebitebakery.com",
        customerPhone: "7897671632",
        onSuccess: async () => {
          setStatusMsg("Payment received. Waiting for secure backend confirmation...");
          try {
            await waitForPaidOrder(orderId);
            navigate(`/order/success/${orderId}`);
          } catch (error) {
            setErrorMsg(getPaymentPageError(error));
          } finally {
            setIsProcessing(false);
          }
        },
        onDismiss: () => {
          setStatusMsg(null);
          setIsProcessing(false);
          setErrorMsg("UPI payment was cancelled or closed. Please retry.");
        },
      });
    } catch (err) {
      setErrorMsg(getPaymentPageError(err));
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-16 max-w-xl mx-auto space-y-6">
      <Card className="text-center space-y-6 bg-white shadow-xl">
        <Smartphone className="h-16 w-16 text-[#E67E22] mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#2C1E16]">Complete Order Payment</h1>
          <p className="text-xs text-[#6E5D4F]">Secure UPI payment through Razorpay</p>
        </div>

        {errorMsg ? (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
            {errorMsg}
          </div>
        ) : null}

        {statusMsg ? (
          <div className="p-3 bg-[#FFF3E6] text-[#2C1E16] text-xs font-semibold rounded-lg border border-[#E67E22]/30">
            {statusMsg}
          </div>
        ) : null}

        <Button onClick={handlePayNow} isLoading={isProcessing} className="w-full h-12 shadow-md">
          <span>Pay Now with UPI</span>
        </Button>

        <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" />
          <span>Only UPI payments are accepted.</span>
        </p>
      </Card>
    </div>
  );
};

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="py-12 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4 bg-white border border-[#E8E2D9] rounded-3xl p-8 shadow-lg">
        <CheckCircle className="h-16 w-16 text-[#27AE60] mx-auto animate-in zoom-in" />
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#2C1E16]">Payment Successful!</h1>
          <p className="text-sm text-[#6E5D4F]">Thank you for your order. Our master bakers are preparing your items.</p>
          {orderId ? <p className="text-xs font-mono text-[#E67E22]">Order Reference: #{orderId}</p> : null}
        </div>

        <div className="pt-2 flex justify-center gap-4">
          <Link to="/customer/orders">
            <Button variant="outline">View Order History</Button>
          </Link>
          <Link to="/products">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>

      {orderId ? <OrderReviewForm orderId={orderId} /> : null}
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
