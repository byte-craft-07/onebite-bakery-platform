import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Sparkles,
  Star,
  Truck,
  XCircle,
} from "lucide-react";
import type { OrderDetails } from "@/services/order.service";

export interface FlipkartOrderTrackerProps {
  order: OrderDetails;
  onRateClick?: () => void;
  isRated?: boolean;
}

interface StepInfo {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TRACKER_STEPS: StepInfo[] = [
  {
    id: 0,
    label: "Order Confirmed",
    sublabel: "Order received & verified",
    icon: Package,
  },
  {
    id: 1,
    label: "Baking & Packed",
    sublabel: "Freshly prepared at bakery",
    icon: Sparkles,
  },
  {
    id: 2,
    label: "Out for Delivery",
    sublabel: "Delivery agent on the way",
    icon: Truck,
  },
  {
    id: 3,
    label: "Delivered",
    sublabel: "Delivered at doorstep",
    icon: CheckCircle2,
  },
];

const FALLBACK_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80";

export const getFlipkartStageIndex = (status: string): number => {
  const s = (status || "").toUpperCase();
  if (s === "DELIVERED") return 3;
  if (s === "OUT_FOR_DELIVERY") return 2;
  if (
    s === "PREPARING" ||
    s === "BAKING" ||
    s === "QUALITY_CHECK" ||
    s === "PACKED" ||
    s === "READY" ||
    s === "READY_FOR_PICKUP"
  ) {
    return 1;
  }
  if (s === "CONFIRMED") return 0;
  return 0; // PENDING
};

export const FlipkartOrderTracker: React.FC<FlipkartOrderTrackerProps> = ({
  order,
  onRateClick,
  isRated = false,
}) => {
  const [isStagesOpen, setIsStagesOpen] = useState(false);

  const isDelivered = order.orderStatus === "DELIVERED";
  const isCancelled = order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";
  const currentStep = getFlipkartStageIndex(order.orderStatus);
  const currentStepInfo = TRACKER_STEPS[currentStep];

  const primaryItem = order.items?.[0];
  const itemCount = order.items?.length || 1;
  const itemImage = (primaryItem as any)?.image || FALLBACK_ITEM_IMAGE;

  return (
    <div className="space-y-4">
      {/* 1. Product Summary & Current Stage Card */}
      <div className="rounded-2xl border border-[#E5DEC9] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Product Image & Info */}
          <div className="flex items-center gap-3.5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-[#FFF8EC] border border-[#E5DEC9] shrink-0 shadow-2xs">
              <img
                src={itemImage}
                alt={primaryItem?.name || "Bakery Item"}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_ITEM_IMAGE;
                }}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-extrabold text-[#3B302B] line-clamp-1">
                {primaryItem?.name || "Artisanal Celebration Cake"}
              </h4>
              <p className="text-xs text-[#7A6E65]">
                Qty: <strong>{primaryItem?.quantity || 1}</strong>
                {itemCount > 1 ? ` • +${itemCount - 1} more item(s)` : ""}
                {" • "}
                Total: <strong className="text-[#3B302B]">₹{order.totalAmount}</strong>
              </p>
              <span className="inline-block text-[10px] font-bold text-[#596B58] bg-[#FFF8EC] border border-[#596B58]/30 px-2 py-0.5 rounded-full">
                100% Fresh Daily Baked
              </span>
            </div>
          </div>

          {/* Current Stage Badge & Action */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-[#7A6E65] uppercase tracking-wider block">
                Current Stage:
              </span>
              <span
                className={`text-xs sm:text-sm font-extrabold ${
                  isDelivered
                    ? "text-emerald-700"
                    : isCancelled
                    ? "text-red-600"
                    : "text-[#596B58]"
                }`}
              >
                {isDelivered
                  ? "✓ Delivered"
                  : isCancelled
                  ? "✕ Cancelled"
                  : currentStepInfo.label}
              </span>
            </div>

            {/* If Delivered or Cancelled: Show Rate Button */}
            {(isDelivered || isCancelled) && onRateClick ? (
              <button
                type="button"
                onClick={onRateClick}
                className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                  isDelivered ? "bg-emerald-700 hover:bg-emerald-800" : "bg-red-700 hover:bg-red-800"
                }`}
              >
                <Star className="h-3.5 w-3.5 fill-current text-[#D8BE91]" />
                <span>{isRated ? "⭐ View / Edit Review" : isDelivered ? "⭐ Rate & Review" : "⭐ Leave Feedback"}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* 2. Status Banner with Click-to-Expand all stages */}
        <div
          onClick={() => setIsStagesOpen(!isStagesOpen)}
          className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
            isDelivered
              ? "bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/70"
              : isCancelled
              ? "bg-red-50/80 border-red-200 hover:bg-red-100/70"
              : "bg-[#FFF8EC] border-[#596B58]/30 hover:bg-[#F7F2E7]"
          }`}
          title="Click to view all stages"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`h-3 w-3 rounded-full shrink-0 ${
                isDelivered
                  ? "bg-emerald-600"
                  : isCancelled
                  ? "bg-red-500"
                  : "bg-[#596B58] animate-ping"
              }`}
            />
            <div>
              <p className="text-xs font-extrabold text-[#3B302B]">
                {isDelivered
                  ? `Order Delivered on ${new Date(order.createdAt).toLocaleDateString()}`
                  : isCancelled
                  ? "Order Cancelled"
                  : `Stage: ${currentStepInfo.label}`}
              </p>
              <p className="text-[11px] text-[#7A6E65]">
                {isDelivered
                  ? "Your fresh baked order was successfully delivered."
                  : isCancelled
                  ? "This order was cancelled. Refund processed."
                  : `${currentStepInfo.sublabel} • Expected delivery: ${
                      order.deliveryTimePreference || "Today within 30-45 mins"
                    }`}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-xs font-bold text-[#596B58] shrink-0 bg-white/80 px-2.5 py-1 rounded-lg border border-[#E5DEC9]"
          >
            <span>{isStagesOpen ? "Hide Stages" : "View All Stages"}</span>
            {isStagesOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 3. All Stages Stepper (Shown when customer clicks to view stages) */}
      {isStagesOpen && !isCancelled ? (
        <div className="rounded-2xl border border-[#E5DEC9] bg-white p-5 sm:p-6 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-2">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#3B302B]">
              All 4 Bakery Delivery Stages:
            </h5>
            <span className="text-[11px] font-bold text-[#7A6E65]">
              {isDelivered ? "4 / 4 Completed" : `Step ${currentStep + 1} of 4`}
            </span>
          </div>

          <div className="pt-4 px-2 sm:px-6">
            <div className="relative flex items-center justify-between">
              {/* Progress Connecting Bar */}
              <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-gray-200 z-0">
                <div
                  className="h-full bg-emerald-600 transition-all duration-700 ease-out"
                  style={{
                    width: isDelivered
                      ? "100%"
                      : `${(currentStep / (TRACKER_STEPS.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {TRACKER_STEPS.map((step) => {
                const isPassed = isDelivered || step.id < currentStep;
                const isCurrent = !isDelivered && step.id === currentStep;
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className="relative z-10 flex flex-col items-center text-center flex-1 max-w-[120px]"
                  >
                    {/* Circle Dot */}
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isPassed
                          ? "bg-emerald-600 text-white shadow-xs"
                          : isCurrent
                          ? "bg-[#596B58] text-[#FFF8EC] ring-4 ring-[#596B58]/20 scale-110 shadow-md animate-pulse"
                          : "bg-white border-2 border-[#E5DEC9] text-[#7A6E65]"
                      }`}
                    >
                      {isPassed ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>

                    {/* Labels */}
                    <div className="mt-2 space-y-0.5">
                      <p
                        className={`text-[11px] sm:text-xs font-bold leading-tight ${
                          isCurrent
                            ? "text-[#596B58]"
                            : isPassed
                            ? "text-[#3B302B]"
                            : "text-[#7A6E65]"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[9px] text-[#7A6E65] hidden sm:block line-clamp-1">
                        {step.sublabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
