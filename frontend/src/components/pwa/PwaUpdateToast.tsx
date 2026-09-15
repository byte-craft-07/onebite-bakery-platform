import React from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export const PwaUpdateToast: React.FC = () => {
  const { isUpdateAvailable, applyUpdate } = usePWA();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] bg-[#3B302B] text-white p-3.5 rounded-2xl shadow-2xl border border-[#D8BE91]/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-xl bg-[#596B58] text-[#D8BE91] shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-[#FFF8EC]">New update available!</p>
          <p className="text-gray-300 text-[11px] truncate">Refresh to get the latest features and fixes.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={applyUpdate}
        className="bg-[#D8BE91] hover:bg-[#c9ad7f] text-[#3B302B] font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-xs active:scale-95"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Refresh</span>
      </button>
    </div>
  );
};
