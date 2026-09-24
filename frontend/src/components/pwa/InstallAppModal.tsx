import React, { useState } from "react";
import { Monitor, Smartphone, X, CheckCircle2, Sparkles, FileText, ArrowRight, MoreVertical } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { detectPlatform, downloadWindowsInstaller, downloadWebShortcut } from "@/utils/appInstaller";

export const InstallAppModal: React.FC = () => {
  const { showInstallModal, setShowInstallModal, promptInstall } = usePWA();
  const [downloadedItem, setDownloadedItem] = useState<string | null>(null);
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(false);

  const platform = detectPlatform();

  if (!showInstallModal) {
    return null;
  }

  const handleAddMobileShortcut = async () => {
    setIsAddingShortcut(true);
    try {
      const installed = await promptInstall();
      if (installed) {
        setShowInstallModal(false);
      } else {
        // If browser didn't open automated prompt, show visual 2-step guide & download web shortcut
        setShowMobileGuide(true);
        downloadWebShortcut();
      }
    } catch {
      setShowMobileGuide(true);
    } finally {
      setIsAddingShortcut(false);
    }
  };

  const handleDownloadDesktopShortcut = () => {
    setDownloadedItem("shortcut");
    downloadWebShortcut();
    downloadWindowsInstaller();
  };

  const handleClose = () => {
    setShowInstallModal(false);
    setDownloadedItem(null);
    setShowMobileGuide(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-[#FFF8EC] border border-[#D8BE91] w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#7A6E65] hover:text-[#3B302B] p-2 rounded-xl hover:bg-[#E5DEC9]/40 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Icon */}
        <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-[#596B58] text-white flex items-center justify-center shadow-md p-1.5">
          <img
            src="/icons/pwa-192x192.png"
            alt="Onebite Bakery"
            className="h-full w-full object-contain rounded-xl"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Title & Subtitle */}
        <div className="flex items-center justify-center gap-1.5">
          <h2 id="install-modal-title" className="text-lg sm:text-xl font-black text-[#3B302B]">
            Add App Shortcut
          </h2>
          <Sparkles className="h-4 w-4 text-[#D8BE91]" />
        </div>
        <p className="text-xs text-[#7A6E65] mt-1 mb-4 max-w-xs mx-auto">
          Add Onebite Bakery shortcut to your phone or desktop for fast 1-click ordering.
        </p>

        {/* Mobile Visual Instructions (When automated prompt is not available) */}
        {showMobileGuide && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#E8F0E6] border border-[#596B58]/40 text-left text-xs text-[#3B302B] animate-in fade-in slide-in-from-top-2">
            <div className="font-extrabold text-[#596B58] flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>How to add shortcut in 2 seconds:</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-[#596B58]">
              <div className="flex items-start gap-2">
                <span className="font-black bg-[#596B58] text-white rounded-full h-4 w-4 flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>Chrome browser ke upar <strong>Three dots (<MoreVertical className="inline h-3 w-3" />)</strong> par tap karein.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black bg-[#596B58] text-white rounded-full h-4 w-4 flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span><strong>&ldquo;Add to Home screen&rdquo;</strong> ya <strong>&ldquo;Install app&rdquo;</strong> par tap karein.</span>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Success Banner */}
        {downloadedItem && (
          <div className="mb-4 p-3 rounded-2xl bg-[#E8F0E6] border border-[#596B58]/30 flex items-center gap-2.5 text-left text-xs animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-[#596B58] shrink-0" />
            <div className="text-[#3B302B]">
              <span className="font-bold text-[#596B58] block">Shortcut Downloaded!</span>
              <span className="text-[#7A6E65] text-[11px]">Check your Downloads folder for the Desktop Shortcut.</span>
            </div>
          </div>
        )}

        {/* Shortcut Action Buttons */}
        <div className="space-y-2.5">
          {/* 1. Mobile Phone Shortcut */}
          <button
            type="button"
            onClick={handleAddMobileShortcut}
            disabled={isAddingShortcut}
            className="w-full bg-[#596B58] hover:bg-[#465545] text-white font-extrabold text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Smartphone className="h-4 w-4" />
            <span>{isAddingShortcut ? "Adding..." : "Add to Phone Home Screen"}</span>
            <ArrowRight className="h-4 w-4 ml-auto opacity-80" />
          </button>

          {/* 2. PC / Desktop Shortcut */}
          <button
            type="button"
            onClick={handleDownloadDesktopShortcut}
            className="w-full bg-white hover:bg-[#F7F2E7] text-[#3B302B] font-extrabold text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 border border-[#D8BE91] shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Monitor className="h-4 w-4 text-[#596B58]" />
            <span>Download Desktop Shortcut</span>
            <FileText className="h-4 w-4 ml-auto text-[#7A6E65]" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#E5DEC9] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#7A6E65]">100% Free &amp; Fast</span>
          <button
            type="button"
            onClick={handleClose}
            className="font-bold text-[#596B58] hover:text-[#3B302B] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
