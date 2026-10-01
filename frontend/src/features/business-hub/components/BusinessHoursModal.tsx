import React from "react";
import { Clock, X, CheckCircle2 } from "lucide-react";

import type { BusinessDayHours } from "@/services/businessHub.service";

interface BusinessHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  hours: BusinessDayHours[];
  currentDay: string;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const BusinessHoursModal: React.FC<BusinessHoursModalProps> = ({
  isOpen,
  onClose,
  hours,
  currentDay,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-hours-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-[#3B302B] dark:text-[#FFF8EC] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <h2 id="business-hours-title" className="text-base font-bold">
              Business Hours
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Business Hours"
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {hours.map((h) => {
            const isToday = h.day.toLowerCase() === currentDay.toLowerCase();
            return (
              <div
                key={h.day}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                  isToday
                    ? "bg-amber-50/80 dark:bg-amber-900/20 font-bold border border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200"
                    : "text-stone-600 dark:text-stone-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isToday ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 shrink-0" />
                  )}
                  <span>{DAY_LABELS[h.day] || h.day}</span>
                  {isToday ? (
                    <span className="text-[10px] uppercase tracking-wider bg-amber-200/80 dark:bg-amber-800/60 px-1.5 py-0.5 rounded-md">
                      Today
                    </span>
                  ) : null}
                </div>

                <div className="text-right">
                  {h.isClosed ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs">
                      Closed
                    </span>
                  ) : (
                    <span className="font-medium text-xs sm:text-sm">
                      {h.openTime} – {h.closeTime}
                    </span>
                  )}
                  {h.specialNote ? (
                    <span className="block text-[10px] text-stone-400">
                      {h.specialNote}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
