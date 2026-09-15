import React, { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
  X,
} from "lucide-react";

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

import {
  buildShareMessage,
  copyToClipboard,
  downloadProductImage,
  getFacebookShareUrl,
  getTelegramShareUrl,
  getWhatsAppShareUrl,
  getXShareUrl,
  isNativeShareSupported,
  recordShareAnalytics,
  shareNative,
  type ShareableProductInfo,
  type ShareChannel,
} from "@/utils/sharing";
import { toast } from "@/contexts/toast.context";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ShareableProductInfo;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showStoryHelper, setShowStoryHelper] = useState(false);
  const [showStatusHelper, setShowStatusHelper] = useState(false);

  const bundle = buildShareMessage(product);
  const productUrl = bundle.url;
  const nativeAvailable = isNativeShareSupported();

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setShowStoryHelper(false);
      setShowStatusHelper(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(productUrl);
    if (success) {
      setCopied(true);
      recordShareAnalytics(product.id, product.slug || product.name, product.name, "copy_link");
      toast.success("Link Copied! 📋", "Product URL has been copied to your clipboard.");
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error("Copy Failed", "Please manually copy the URL from the field.");
    }
  };

  const handleSavePhoto = async () => {
    if (!product.mainImage) return;
    setIsSavingImage(true);
    try {
      const filename = `${product.slug || "bakery-product"}.jpg`;
      await downloadProductImage(product.mainImage, filename);
      toast.success("Photo Saved! 🍰", "Product image downloaded to your device.");
    } catch {
      toast.error("Download Failed", "Could not download image.");
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleManualStatusFlow = async () => {
    recordShareAnalytics(product.id, product.slug || product.name, product.name, "whatsapp_status");
    await copyToClipboard(bundle.fullMessage);
    if (product.mainImage) {
      downloadProductImage(product.mainImage, `${product.slug || "bakery-product"}.jpg`);
    }
    setShowStatusHelper(true);
    setShowStoryHelper(false);
    toast.success("Photo & Caption Ready! 📸", "Image downloaded and text copied to your clipboard.");
  };

  const handleChannelClick = async (channel: ShareChannel) => {
    recordShareAnalytics(product.id, product.slug || product.name, product.name, channel);

    if (channel === "whatsapp_status") {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile && nativeAvailable) {
        const res = await shareNative(product);
        if (res.success || res.aborted) {
          return;
        }
      }
      await handleManualStatusFlow();
      return;
    }

    let url = "";
    switch (channel) {
      case "whatsapp":
        url = getWhatsAppShareUrl(bundle.fullMessage);
        break;
      case "telegram":
        url = getTelegramShareUrl(productUrl, bundle.text);
        break;
      case "facebook":
        url = getFacebookShareUrl(productUrl);
        break;
      case "x":
        url = getXShareUrl(productUrl, bundle.text);
        break;
      default:
        break;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleNativeShare = async () => {
    await shareNative(product);
    onClose();
  };

  const handleInstagramStoryFlow = async () => {
    await copyToClipboard(productUrl);
    if (product.mainImage) {
      downloadProductImage(product.mainImage, `${product.slug || "bakery-product"}.jpg`);
    }
    recordShareAnalytics(product.id, product.slug || product.name, product.name, "instagram_story");
    setShowStoryHelper(true);
    setShowStatusHelper(false);
    toast.add("Photo & Link Ready for Instagram! 📸", "Image saved and link copied for your Story sticker.", {
      image: product.mainImage,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-[#FFF8EC] border border-[#E5DEC9] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-1 border-b border-[#E5DEC9]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#596B58] text-[#FFF8EC]">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base sm:text-lg font-black text-[#3B302B]">
                Share this Bakery Delight
              </h2>
              <p className="text-xs text-[#7A6E65]">Share with friends, family, or social stories</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1.5 rounded-xl text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#E5DEC9]/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Snapshot Card */}
        <div className="flex items-center justify-between gap-3.5 p-3 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {product.mainImage ? (
              <img
                src={product.mainImage}
                alt={product.name}
                className="h-16 w-16 rounded-xl object-cover border border-[#E5DEC9] shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-[#FFF8EC] border border-[#D8BE91] flex items-center justify-center text-2xl shrink-0">
                🍰
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-0.5">
              <h3 className="text-sm font-extrabold text-[#3B302B] truncate">{product.name}</h3>
              {bundle.priceText && (
                <p className="text-sm font-black text-[#596B58]">{bundle.priceText}</p>
              )}
              <p className="text-[11px] text-[#7A6E65] truncate">100% Handcrafted • Eggless Specialty</p>
            </div>
          </div>

          {product.mainImage && (
            <button
              type="button"
              onClick={handleSavePhoto}
              disabled={isSavingImage}
              aria-label="Save product photo"
              title="Save photo to device"
              className="px-2.5 py-1.5 rounded-xl bg-[#FFF8EC] hover:bg-[#F7F2E7] border border-[#596B58]/30 text-[#596B58] font-bold text-xs flex flex-col items-center gap-0.5 shrink-0 transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span className="text-[10px]">{isSavingImage ? "Saving..." : "Save Photo"}</span>
            </button>
          )}
        </div>

        {/* Primary Social & Messaging Grid */}
        <div className="space-y-2">
          <label className="block text-[11px] font-black uppercase tracking-wider text-[#7A6E65]">
            Quick Share Channels:
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => handleChannelClick("whatsapp")}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-xs transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span>WhatsApp</span>
            </button>

            {/* Instagram Story */}
            <button
              type="button"
              onClick={handleInstagramStoryFlow}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-800 font-extrabold text-xs transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <InstagramIcon className="h-5 w-5" />
              </div>
              <span>Insta Story</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={() => handleChannelClick("telegram")}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-extrabold text-xs transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Send className="h-5 w-5" />
              </div>
              <span>Telegram</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleChannelClick("facebook")}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-extrabold text-xs transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ExternalLink className="h-5 w-5" />
              </div>
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* Secondary Row: X, WhatsApp Status, and Native More */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleChannelClick("x")}
            className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-white border border-[#E5DEC9] text-[#3B302B] font-bold text-xs hover:border-[#596B58] transition-colors flex items-center justify-center gap-2"
          >
            <span className="font-black">𝕏</span>
            <span>Share on X</span>
          </button>

          <button
            type="button"
            onClick={() => handleChannelClick("whatsapp_status")}
            className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-white border border-[#E5DEC9] text-[#3B302B] font-bold text-xs hover:border-[#596B58] transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>WhatsApp Status</span>
          </button>

          {nativeAvailable && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2.5 px-4 rounded-xl bg-[#596B58] hover:bg-[#465545] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>More Options</span>
            </button>
          )}
        </div>

        {/* WhatsApp Status Instruction Helper (Expands when clicked on desktop or fallback) */}
        {showStatusHelper && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2 text-xs text-emerald-950 animate-in fade-in">
            <div className="flex items-center justify-between font-extrabold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>How to Post on WhatsApp Status:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowStatusHelper(false)}
                className="text-emerald-600 font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900/90 leading-relaxed">
              <li>Photo has been saved to your downloads & caption link is copied!</li>
              <li>Open WhatsApp on your mobile and tap the <strong>Updates / Status</strong> tab.</li>
              <li>Tap <strong>My Status</strong> (or the Camera icon).</li>
              <li>Select the downloaded product photo and paste the copied link in caption!</li>
            </ol>
            <div className="pt-1 flex gap-2">
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Open WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Instagram Story Instruction Helper (Expands when clicked) */}
        {showStoryHelper && (
          <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-200 space-y-2 text-xs text-pink-950 animate-in fade-in">
            <div className="flex items-center justify-between font-extrabold text-pink-900">
              <span className="flex items-center gap-1.5">
                <InstagramIcon className="h-4 w-4 text-pink-600" />
                <span>How to Post on Instagram Story:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowStoryHelper(false)}
                className="text-pink-600 font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-pink-900/90 leading-relaxed">
              <li>Product photo saved & link copied to your clipboard!</li>
              <li>Open Instagram and create a new Story with your downloaded photo.</li>
              <li>Tap the <strong>Sticker</strong> icon in Instagram and select <strong>LINK</strong>.</li>
              <li>Paste the copied URL and publish your Story!</li>
            </ol>
          </div>
        )}

        {/* One-Click Copy Link Bar */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[11px] font-black uppercase tracking-wider text-[#7A6E65]">
            Direct Product Link:
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#E5DEC9] shadow-2xs">
            <input
              type="text"
              readOnly
              value={productUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-transparent border-none text-xs text-[#3B302B] font-medium px-2 outline-none select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-[#596B58] hover:bg-[#465545] text-white active:scale-95"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
