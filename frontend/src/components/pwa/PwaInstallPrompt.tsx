import React, { useEffect, useState } from "react";
import { Download, Sparkles, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export const PwaInstallPrompt: React.FC = () => {
  const {
    isInstallable,
    isStandalone,
    isInstalled,
    isInstallBannerDismissed,
    dismissInstallBanner,
    promptInstall,
    setShowInstallModal,
  } = usePWA();

  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Only show if installable, not standalone, and not dismissed
    if (isInstallable && !isStandalone && !isInstalled && !isInstallBannerDismissed) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 3500); // 3.5s delay so user interacts with page first
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isInstallable, isStandalone, isInstalled, isInstallBannerDismissed]);

  if (!visible) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const installed = await promptInstall();
      if (installed) {
        setVisible(false);
      } else {
        setShowInstallModal(true);
        setVisible(false);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    dismissInstallBanner();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Install App"
      className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-40 max-w-sm w-[calc(100%-1.5rem)] sm:w-auto bg-[#FFF8EC] border border-[#D8BE91] p-4 rounded-2xl shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-[#596B58] text-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
          <img
            src="/icons/pwa-192x192.png"
            alt="Onebite Bakery"
            className="h-full w-full object-contain rounded-lg"
            onError={(e) => {
              // fallback to cake emoji/icon if image fails
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-[#3B302B] truncate">Install Onebite Bakery</h3>
            <Sparkles className="h-3.5 w-3.5 text-[#D8BE91] shrink-0" />
          </div>
          <p className="text-xs text-[#7A6E65] mt-0.5 leading-snug">
            Add to home screen for faster ordering, instant order tracking & offline menu access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-[#7A6E65] hover:text-[#3B302B] p-1 rounded-lg hover:bg-[#E5DEC9]/40 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-[#E5DEC9]">
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          className="flex-1 bg-[#596B58] hover:bg-[#465545] text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{installing ? "Installing..." : "Install App"}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="bg-transparent hover:bg-[#E5DEC9]/30 text-[#7A6E65] font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};
