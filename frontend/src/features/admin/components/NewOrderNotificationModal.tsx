import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Phone,
  ShoppingBag,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import type { NewOrderEventPayload } from "@/services/socket.service";
import {
  getSoundSettings,
  playOrderNotificationSound,
  setSoundEnabled,
} from "@/utils/sound.util";

interface NewOrderNotificationModalProps {
  ordersQueue: NewOrderEventPayload[];
  onDismiss: (orderId: string) => void;
  onDismissAll: () => void;
}

export const NewOrderNotificationModal: React.FC<NewOrderNotificationModalProps> = ({
  ordersQueue,
  onDismiss,
  onDismissAll,
}) => {
  const navigate = useNavigate();
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(getSoundSettings().soundEnabled);

  useEffect(() => {
    const handleSettingsChange = () => {
      setSoundEnabledState(getSoundSettings().soundEnabled);
    };
    window.addEventListener("onebitebakery_sound_settings_changed", handleSettingsChange);
    return () => {
      window.removeEventListener("onebitebakery_sound_settings_changed", handleSettingsChange);
    };
  }, []);

  if (ordersQueue.length === 0) {
    return null;
  }

  // Active order is the most recent order in the queue
  const currentOrder = ordersQueue[ordersQueue.length - 1];
  const queueCount = ordersQueue.length;

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    setSoundEnabledState(nextState);
    if (nextState) {
      void playOrderNotificationSound();
    }
  };

  const handleCopyPhone = (phone: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone).then(() => {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      });
    }
  };

  const handleViewOrder = () => {
    onDismiss(currentOrder.orderId);
    navigate(`/admin/orders?search=${encodeURIComponent(currentOrder.orderNumber)}`);
  };

  const formatPaymentMethod = (method?: string) => {
    if (!method) return "UPI";
    if (method === "COD" || method === "CASH_ON_DELIVERY") return "Cash on Delivery (COD)";
    if (method === "UPI") return "Instant UPI";
    if (method === "RAZORPAY") return "Online Payment";
    return method;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full px-3 sm:px-0 pointer-events-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentOrder.orderId || currentOrder.orderNumber}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-[#FFFDF9] border-2 border-[#596B58]/30 rounded-3xl shadow-2xl p-5 sm:p-6 text-[#3B302B] relative overflow-hidden backdrop-blur-md"
        >
          {/* Subtle Top Glowing Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D9A05B] via-[#596B58] to-[#D9A05B] animate-pulse" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5DEC9]">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-[#596B58] text-white shadow-md">
                <BellRing className="h-5 w-5 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A05B] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D9A05B]" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-[#3B302B] leading-tight">
                    New Order Received!
                  </h3>
                  {queueCount > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D9A05B]/20 border border-[#D9A05B]/40 text-[#A66E2E] text-[10px] font-extrabold tracking-wide">
                      +{queueCount - 1} more
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-[#596B58] flex items-center gap-1 mt-0.5">
                  <span>Order #{currentOrder.orderNumber}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 font-normal">Just now</span>
                </p>
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleSound}
                className="p-1.5 rounded-xl hover:bg-[#FFF8EC] text-gray-500 hover:text-[#596B58] transition-colors"
                title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
                aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-[#596B58]" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onDismiss(currentOrder.orderId)}
                className="p-1.5 rounded-xl hover:bg-[#FFF8EC] text-gray-400 hover:text-red-500 transition-colors"
                title="Dismiss"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Customer & Fulfillment Details */}
          <div className="my-3 py-2.5 px-3 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9]/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-[#3B302B]">
                <User className="h-3.5 w-3.5 text-[#596B58]" />
                <span>{currentOrder.customer?.name || "Bakery Customer"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                <Phone className="h-3 w-3 text-[#596B58]" />
                <span>{currentOrder.customer?.phone || "N/A"}</span>
                {currentOrder.customer?.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(currentOrder.customer.phone)}
                    className="p-0.5 text-gray-400 hover:text-[#596B58]"
                    title="Copy phone"
                  >
                    {copiedPhone ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Order Type & Payment Method */}
            <div className="flex items-center justify-between pt-1 border-t border-[#E5DEC9]/60 text-[11px] text-[#7A6E65]">
              <div className="flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3 text-[#D9A05B]" />
                <span>
                  {currentOrder.orderType === "STORE_PICKUP"
                    ? "Store Pickup"
                    : "Home Delivery"}
                </span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-[#3B302B]">
                <CreditCard className="h-3 w-3 text-[#596B58]" />
                <span>{formatPaymentMethod(currentOrder.paymentMethod)}</span>
              </div>
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="space-y-1.5 my-2.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <ShoppingBag className="h-3 w-3 text-[#596B58]" />
              <span>Items ({currentOrder.items?.length || 0})</span>
            </div>

            <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
              {currentOrder.items && currentOrder.items.length > 0 ? (
                currentOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-0.5 text-[#3B302B]"
                  >
                    <span className="truncate pr-2 font-medium">
                      {item.name}
                    </span>
                    <span className="font-bold text-[#596B58] whitespace-nowrap bg-[#596B58]/10 px-1.5 py-0.5 rounded-md text-[11px]">
                      × {item.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">Order details included</p>
              )}
            </div>
          </div>

          {/* Footer Total & Primary Actions */}
          <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider leading-none">
                Total Amount
              </p>
              <p className="text-base sm:text-lg font-black text-[#596B58] leading-tight mt-0.5">
                ₹{currentOrder.totalAmount}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {queueCount > 1 && (
                <button
                  type="button"
                  onClick={onDismissAll}
                  className="px-3 py-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold text-gray-600 hover:bg-[#FFF8EC] transition-colors"
                >
                  Dismiss All
                </button>
              )}

              <button
                type="button"
                onClick={handleViewOrder}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#596B58] text-white font-bold text-xs hover:bg-[#475746] transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>View Order</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
