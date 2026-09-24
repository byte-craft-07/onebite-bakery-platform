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
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const order = await orderService.getOrderById(orderId);

    const statusStr = String(order.paymentStatus || "");
    if (
      statusStr === "SUCCESS" ||
      statusStr === "PAID" ||
      statusStr === "PROCESSING" ||
      statusStr === "AUTHORIZED"
    ) {
      return order;
    }


    if (order.paymentStatus === "FAILED" || order.paymentStatus === "CANCELLED") {
      throw new Error("UPI payment was not completed. Please retry.");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return orderService.getOrderById(orderId);
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

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMsg("You are currently offline. Please reconnect to the internet to complete payment.");
      return;
    }

    setIsProcessing(true);

    try {
      await orderService.getOrderById(orderId);
      const initRes = await paymentService.initiatePayment({ orderId, provider: "RAZORPAY" });

      setStatusMsg("Opening UPI payment...");
      await razorpayService.openPaymentModal({
        payment: initRes,
        customerName: "Onebite Bakery Customer",
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
        <Smartphone className="h-16 w-16 text-[#596B58] mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#3B302B]">Complete Order Payment</h1>
          <p className="text-xs text-[#7A6E65]">Secure UPI payment through Razorpay</p>
        </div>

        {errorMsg ? (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
            {errorMsg}
          </div>
        ) : null}

        {statusMsg ? (
          <div className="p-3 bg-[#FFF8EC] text-[#3B302B] text-xs font-semibold rounded-lg border border-[#596B58]/30">
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
      <div className="text-center space-y-4 bg-white border border-[#E5DEC9] rounded-3xl p-8 shadow-lg">
        <CheckCircle className="h-16 w-16 text-[#27AE60] mx-auto animate-in zoom-in" />
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#3B302B]">Payment Successful!</h1>
          <p className="text-sm text-[#7A6E65]">Thank you for your order. Our master bakers are preparing your items.</p>
          {orderId ? <p className="text-xs font-mono text-[#596B58]">Order Reference: #{orderId}</p> : null}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link to="/customer/orders" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">View Order History</Button>
          </Link>
          <Link to="/products" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Back to Catalog</Button>
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
    <div className="py-10 sm:py-16 max-w-xl mx-auto text-center space-y-6 bg-white border border-red-100 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg">
      <AlertTriangle className="h-14 w-14 sm:h-16 sm:w-16 text-red-500 mx-auto" />
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">Payment Failed</h1>
        <p className="text-xs sm:text-sm text-[#7A6E65]">
          Your payment could not be processed. Don't worry, your order items remain saved.
        </p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        {orderId ? (
          <Link to={`/payment/${orderId}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#596B58] hover:bg-[#495948]">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              <span>Retry Payment</span>
            </Button>
          </Link>
        ) : null}
        <Link to="/cart" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">Return to Cart</Button>
        </Link>
      </div>
    </div>
  );
};
