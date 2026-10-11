import React, { useState } from "react";
import { Download, Sparkles, X, MoreVertical } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export const InstallAppModal: React.FC = () => {
  const { showInstallModal, setShowInstallModal, promptInstall } = usePWA();
  const [installing, setInstalling] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  if (!showInstallModal) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const installed = await promptInstall();
      if (installed) {
        setShowInstallModal(false);
        setShowBrowserGuide(false);
      } else {
        setShowBrowserGuide(true);
      }
    } catch {
      setShowBrowserGuide(true);
    } finally {
      setInstalling(false);
    }
  };

  const handleClose = () => {
    setShowInstallModal(false);
    setShowBrowserGuide(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install App"
      className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-50 max-w-sm w-[calc(100%-1.5rem)] sm:w-auto bg-[#FFF8EC] border border-[#D8BE91] p-4 rounded-2xl shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl bg-[#596B58] text-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
          <img
            src="/icons/pwa-192x192.png"
            alt="Onebite Bakery"
            className="h-full w-full object-contain rounded-lg"
            onError={(e) => {
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
            Add to home screen for faster ordering, instant order tracking &amp; offline menu access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="text-[#7A6E65] hover:text-[#3B302B] p-1 rounded-lg hover:bg-[#E5DEC9]/40 transition-colors cursor-pointer"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showBrowserGuide && (
        <div className="mt-3 p-3 rounded-xl bg-[#E8F0E6] border border-[#596B58]/40 text-left text-xs text-[#3B302B] animate-in fade-in">
          <div className="font-extrabold text-[#596B58] flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>Install directly from browser menu:</span>
          </div>
          <div className="space-y-1 text-[11px] text-[#596B58]">
            <div className="flex items-start gap-2">
              <span className="font-black bg-[#596B58] text-white rounded-full h-4 w-4 flex items-center justify-center shrink-0 text-[10px]">1</span>
              <span>Browser ke upar <strong>Three dots (<MoreVertical className="inline h-3 w-3" />)</strong> par tap karein.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-black bg-[#596B58] text-white rounded-full h-4 w-4 flex items-center justify-center shrink-0 text-[10px]">2</span>
              <span><strong>&ldquo;Install app&rdquo;</strong> ya <strong>&ldquo;Add to Home screen&rdquo;</strong> par tap karein.</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-[#E5DEC9]">
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          className="flex-1 bg-[#596B58] hover:bg-[#465545] text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{installing ? "Installing..." : "Install App"}</span>
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="bg-transparent hover:bg-[#E5DEC9]/30 text-[#7A6E65] font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

