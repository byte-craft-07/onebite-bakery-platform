import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { useToast, type ToastItem, type ToastType } from "@/contexts/toast.context";

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case "add":
      return {
        badgeText: "Added",
        badgeBg: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
        iconBg: "bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white shadow-emerald-500/25",
        borderColor: "border-emerald-200/80 hover:border-emerald-300",
        progressBg: "bg-gradient-to-r from-emerald-500 to-amber-400",
        glowColor: "shadow-[0_8px_30px_rgb(16,185,129,0.12)]",
        icon: PlusCircle,
        secondaryIcon: ShoppingBag,
      };
    case "update":
      return {
        badgeText: "Updated",
        badgeBg: "bg-[#A8B89A]/20 text-[#596B58] border-[#A8B89A]/40",
        iconBg: "bg-gradient-to-tr from-[#596B58] to-[#A8B89A] text-white shadow-[#596B58]/25",
        borderColor: "border-[#A8B89A]/80 hover:border-[#596B58]",
        progressBg: "bg-gradient-to-r from-[#596B58] to-[#A8B89A]",
        glowColor: "shadow-[0_8px_30px_rgba(89,107,88,0.14)]",
        icon: RefreshCw,
        secondaryIcon: Sparkles,
      };
    case "delete":
      return {
        badgeText: "Removed",
        badgeBg: "bg-rose-500/15 text-rose-700 border-rose-500/30",
        iconBg: "bg-gradient-to-tr from-rose-500 to-red-500 text-white shadow-rose-500/25",
        borderColor: "border-rose-200/80 hover:border-rose-300",
        progressBg: "bg-gradient-to-r from-rose-500 to-red-500",
        glowColor: "shadow-[0_8px_30px_rgb(244,63,94,0.14)]",
        icon: Trash2,
        secondaryIcon: MinusCircle,
      };
    case "success":
      return {
        badgeText: "Success",
        badgeBg: "bg-green-500/15 text-green-700 border-green-500/30",
        iconBg: "bg-gradient-to-tr from-green-600 to-emerald-500 text-white shadow-green-500/25",
        borderColor: "border-green-200/80 hover:border-green-300",
        progressBg: "bg-gradient-to-r from-green-500 to-emerald-500",
        glowColor: "shadow-[0_8px_30px_rgb(34,197,94,0.12)]",
        icon: CheckCircle2,
        secondaryIcon: Sparkles,
      };
    case "error":
      return {
        badgeText: "Notice",
        badgeBg: "bg-red-500/15 text-red-700 border-red-500/30",
        iconBg: "bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-red-500/25",
        borderColor: "border-red-200/80 hover:border-red-300",
        progressBg: "bg-gradient-to-r from-red-500 to-rose-500",
        glowColor: "shadow-[0_8px_30px_rgb(239,68,68,0.14)]",
        icon: AlertCircle,
        secondaryIcon: AlertCircle,
      };
    case "info":
    default:
      return {
        badgeText: "Info",
        badgeBg: "bg-[#596B58]/15 text-[#596B58] border-[#596B58]/30",
        iconBg: "bg-gradient-to-tr from-[#596B58] to-[#A8B89A] text-white shadow-[#596B58]/25",
        borderColor: "border-[#E5DEC9] hover:border-[#596B58]/40",
        progressBg: "bg-gradient-to-r from-[#596B58] to-[#A8B89A]",
        glowColor: "shadow-[0_8px_30px_rgba(59,48,43,0.08)]",
        icon: Info,
        secondaryIcon: Sparkles,
      };
  }
};

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const config = getToastConfig(toast.type);
  const Icon = config.icon;
  const duration = toast.duration ?? 3500;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [duration, onDismiss, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -15, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={`relative w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl border p-4 ${config.borderColor} ${config.glowColor} overflow-hidden pointer-events-auto transition-all`}
    >
      <div className="flex items-start gap-3.5">
        {/* Toast Icon Badge or Thumbnail */}
        {toast.image ? (
          <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-[#FFF8EC] border border-[#E5DEC9] shrink-0 shadow-2xs">
            <img src={toast.image} alt="" className="h-full w-full object-cover" />
            <div
              className={`absolute -bottom-1 -right-1 p-1 rounded-full ${config.iconBg} border-2 border-white`}
            >
              <Icon className="h-2.5 w-2.5" />
            </div>
          </div>
        ) : (
          <div
            className={`p-2.5 rounded-xl ${config.iconBg} shadow-md shrink-0 flex items-center justify-center`}
          >
            <Icon className="h-5 w-5 animate-in zoom-in" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full border ${config.badgeBg}`}
            >
              {config.badgeText}
            </span>
            <span className="text-xs font-extrabold text-[#3B302B] truncate">{toast.title}</span>
          </div>

          {toast.message && (
            <p className="text-xs text-[#7A6E65] leading-snug line-clamp-2 mt-0.5">{toast.message}</p>
          )}

          {toast.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="text-xs font-extrabold text-[#596B58] hover:text-[#495948] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{toast.action.label}</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
        <div
          className={`h-full ${config.progressBg} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 items-end max-w-full px-3 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
