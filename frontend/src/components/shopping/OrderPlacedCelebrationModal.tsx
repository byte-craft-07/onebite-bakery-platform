import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Cake,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  PartyPopper,
  QrCode,
  ShoppingBag,
  Truck,
  X,
  Zap,
} from "lucide-react";

import { invoiceService } from "@/services/invoice.service";
import type { OrderDetails } from "@/services/order.service";

interface OrderPlacedCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetails;
}

// Generate animated confetti particles
const CONFETTI_COLORS = ["#596B58", "#F39C12", "#27AE60", "#E74C3C", "#8E44AD", "#3498DB", "#F1C40F", "#FF85A2"];

const ConfettiParticle: React.FC<{ index: number }> = ({ index }) => {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + (index % 6) * 2;
  const initialX = (index * 24) % 360 - 180;
  const initialY = -120 - (index % 4) * 20;
  const targetX = initialX + ((index % 5) - 2) * 80;
  const targetY = 320 + (index % 5) * 50;
  const rotation = (index * 65) % 360;
  const duration = 1.8 + (index % 5) * 0.3;

  return (
    <motion.div
      initial={{
        opacity: 1,
        x: initialX,
        y: initialY,
        scale: 0.2,
        rotate: 0,
      }}
      animate={{
        opacity: [1, 1, 0.8, 0],
        x: targetX,
        y: targetY,
        scale: [0.2, 1.2, 1, 0.8],
        rotate: rotation + 720,
      }}
      transition={{
        duration,
        ease: "easeOut",
        delay: (index % 8) * 0.04,
      }}
      style={{
        backgroundColor: color,
        width: `${size}px`,
        height: `${size * (index % 2 === 0 ? 1 : 1.6)}px`,
        borderRadius: index % 3 === 0 ? "50%" : index % 3 === 1 ? "2px" : "8px 2px",
      }}
      className="absolute top-1/4 left-1/2 pointer-events-none z-50 shadow-xs"
    />
  );
};

export const OrderPlacedCelebrationModal: React.FC<OrderPlacedCelebrationModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {
        // Ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/65 backdrop-blur-sm">
        {/* Confetti Spawner */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-60">
          {Array.from({ length: 32 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E5DEC9] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col z-50"
        >
          {/* Top Decorative Header - Sage Background */}
          <div className="relative bg-[#596B58] p-6 sm:p-7 text-[#FFF8EC] text-center overflow-hidden">
            {/* Background Radial Glow & Concentric Rings */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_rgba(0,0,0,0.1)_80%)] pointer-events-none" />
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-black/15 blur-xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
              aria-label="Close modal"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* Checkmark in Concentric Glowing Circles */}
            <div className="relative mx-auto mb-3.5 flex items-center justify-center">
              {/* Outer Faint Ring */}
              <div className="absolute w-28 h-28 rounded-full border border-white/20 bg-white/5 pointer-events-none animate-pulse" />
              {/* Middle Ring */}
              <div className="absolute w-22 h-22 rounded-full border-2 border-white/40 bg-white/10 pointer-events-none" />

              {/* Inner Solid White Circle with Green Check */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.45, type: "spring", stiffness: 400 }}
                className="relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow-xl border-4 border-white/90"
              >
                <Check className="h-9 w-9 sm:h-10 sm:w-10 text-emerald-700 stroke-[3.5]" />
              </motion.div>
            </div>

            <div className="space-y-1.5 relative z-10">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#FFF8EC] shadow-xs border border-white/20">
                <PartyPopper className="h-3.5 w-3.5 text-[#D8BE91]" />
                <span>ORDER PLACED SUCCESSFULLY!</span>
              </div>

              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FFF8EC] drop-shadow-xs">
                Baking Happiness for You!
              </h2>

              {/* Subheading */}
              <p className="text-xs sm:text-sm text-[#FFF8EC]/90 max-w-sm sm:max-w-md mx-auto font-medium leading-relaxed">
                Your fresh artisanal bakery order has been confirmed & sent to our master bakers.
              </p>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto max-h-[calc(92vh-200px)]">
            {/* Card 1: ORDER NUMBER */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-[#E5DEC9] flex items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#7A6E65]">
                  ORDER NUMBER
                </span>
                <p className="font-mono font-black text-base sm:text-lg text-[#596B58] tracking-wide">
                  {order.orderNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-[#E5DEC9] bg-white hover:bg-[#FFF8EC] text-xs font-bold text-[#3B302B] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-700 font-extrabold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#7A6E65] stroke-[2.5]" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Grid 2: PAYMENT STATUS & FULFILLMENT */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Payment Status */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#7A6E65] uppercase tracking-wider flex items-center gap-1.5">
                  {order.paymentMethod === "COD" ? (
                    <Banknote className="h-3.5 w-3.5 text-amber-700" />
                  ) : (
                    <QrCode className="h-3.5 w-3.5 text-[#596B58]" />
                  )}
                  <span>PAYMENT STATUS</span>
                </span>
                <p className="font-extrabold text-[#3B302B] text-xs sm:text-sm flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      order.paymentMethod === "COD" ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                  />
                  <span>
                    {order.paymentMethod === "COD"
                      ? `COD (₹${order.totalAmount} Due)`
                      : `UPI Paid (₹${order.totalAmount})`}
                  </span>
                </p>
              </div>

              {/* Fulfillment */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#7A6E65] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-[#596B58]" />
                  <span>FULFILLMENT</span>
                </span>
                <p className="font-extrabold text-[#3B302B] text-xs sm:text-sm truncate">
                  {order.fulfillmentType === "STORE_PICKUP" ? "Store Pickup" : "Doorstep Delivery"}
                </p>
              </div>
            </div>

            {/* Card 3: Instant Delivery / Scheduled Delivery Notice */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5DEC9] flex items-start gap-3 text-xs shadow-2xs">
              <Clock className="h-5 w-5 text-[#596B58] shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <p className="font-bold text-xs sm:text-sm text-[#3B302B] flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#596B58] fill-current shrink-0" />
                  <span>
                    {order.deliveryTimePreference?.replace("⚡ ", "") || "Instant Delivery (Within 30-45 mins)"}
                  </span>
                </p>
                <p className="text-[11px] sm:text-xs text-[#7A6E65] leading-normal">
                  Our live tracker will notify you step-by-step as your cake is baked and dispatched.
                </p>
              </div>
            </div>

            {/* Card 4: Live Bakery Status Progress */}
            <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#3B302B]">
                <span className="flex items-center gap-1.5">
                  <Cake className="h-4 w-4 text-[#596B58]" />
                  <span>Live Bakery Status</span>
                </span>
                <span className="text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  Step 1 of 4 Active
                </span>
              </div>

              {/* 4 Step Progress Bars */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
                {/* Step 1: Received */}
                <div className="space-y-1.5">
                  <div className="h-1.5 sm:h-2 rounded-full bg-[#596B58]" />
                  <p className="font-bold text-[#596B58]">Received</p>
                </div>

                {/* Step 2: Baking */}
                <div className="space-y-1.5">
                  <div className="h-1.5 sm:h-2 rounded-full bg-[#A8B89A]" />
                  <p className="font-medium text-[#7A6E65]">Baking</p>
                </div>

                {/* Step 3: Quality Check */}
                <div className="space-y-1.5">
                  <div className="h-1.5 sm:h-2 rounded-full bg-gray-200" />
                  <p className="font-medium text-gray-400">Quality Check</p>
                </div>

                {/* Step 4: Dispatch */}
                <div className="space-y-1.5">
                  <div className="h-1.5 sm:h-2 rounded-full bg-gray-200" />
                  <p className="font-medium text-gray-400">Dispatch</p>
                </div>
              </div>
            </div>

            {/* Card 5: Action Buttons */}
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Download Invoice Button */}
                <button
                  type="button"
                  onClick={() => invoiceService.downloadOrderInvoice(order)}
                  className="w-full border-2 border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC] bg-white font-extrabold text-xs sm:text-sm h-12 rounded-2xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4 stroke-[2.5]" />
                  <span>Download Invoice</span>
                </button>

                {/* Track Live Order Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (order.id) {
                      navigate(`/customer/orders/${order.id}`);
                    } else {
                      navigate("/customer/orders");
                    }
                  }}
                  className="w-full bg-[#596B58] hover:bg-[#495948] text-[#FFF8EC] font-extrabold text-xs sm:text-sm h-12 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <FileText className="h-4 w-4 stroke-[2.5]" />
                  <span>Track Live Order</span>
                </button>
              </div>

              {/* Continue Shopping Link */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/products");
                }}
                className="w-full py-1.5 text-xs sm:text-sm font-bold text-[#7A6E65] hover:text-[#596B58] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Continue Shopping & Browse More Cakes</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
