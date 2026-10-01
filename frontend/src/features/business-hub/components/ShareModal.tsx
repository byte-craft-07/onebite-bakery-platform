import React, { useState } from "react";
import { Copy, Check, X, Share2, MessageCircle, Mail } from "lucide-react";

import { businessHubService } from "@/services/businessHub.service";
import { toast } from "@/contexts/toast.context";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  tagline: string;
  shareUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  businessName,
  tagline,
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!", "Business Hub URL copied to clipboard.");
      businessHubService.trackEvent("share");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed", "Please copy the URL manually.");
    }
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Check out ${businessName} — ${tagline}\n${shareUrl}`,
  )}`;

  const emailShareUrl = `mailto:?subject=${encodeURIComponent(
    `${businessName} - Digital Business Hub`,
  )}&body=${encodeURIComponent(`Check out ${businessName}:\n${shareUrl}`)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 text-[#3B302B] dark:text-[#FFF8EC] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <h2 id="share-modal-title" className="text-base font-bold">
              Share Business Hub
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Share Modal"
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-500">
            Shareable Page Link
          </label>
          <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-2.5 text-xs text-stone-700 dark:text-stone-300 font-mono focus:outline-hidden select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3B302B] hover:bg-[#28211D] text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-stone-500 block text-center">
            Or share directly via
          </span>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => businessHubService.trackEvent("share")}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-2xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
            <a
              href={emailShareUrl}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-700 hover:bg-stone-800 text-white font-semibold text-xs transition-colors shadow-2xs"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
