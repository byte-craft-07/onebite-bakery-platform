import React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline } = usePWA();

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
        !isOnline
          ? "bg-[#3B302B] text-[#FFF8EC] border-amber-600/40 animate-pulse"
          : "bg-[#596B58] text-white border-green-400/40"
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>You are offline. Reconnect to place orders or make payments.</span>
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5 text-green-300 shrink-0" />
          <span>You&apos;re back online! Connection restored.</span>
        </>
      )}
    </div>
  );
};
