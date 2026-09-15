import React, { useState } from "react";
import { Share2 } from "lucide-react";

import {
  isNativeShareSupported,
  shareNative,
  type ShareableProductInfo,
} from "@/utils/sharing";
import { ShareModal } from "./ShareModal";

export interface ShareButtonProps {
  product: ShareableProductInfo;
  variant?: "floating" | "outline" | "solid" | "ghost" | "pill";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  product,
  variant = "outline",
  size = "md",
  className = "",
  showLabel = true,
  label = "Share",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // On mobile devices where native share is available and not standalone fallback, try native share first
    // If native share fails or if user is on desktop, open modal
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile && isNativeShareSupported()) {
      const result = await shareNative(product);
      if (result.success || result.aborted) {
        return;
      }
    }

    setIsModalOpen(true);
  };

  // Variant styles
  let variantClasses = "";
  switch (variant) {
    case "floating":
      variantClasses =
        "p-3 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-[#E5DEC9]/40";
      break;
    case "solid":
      variantClasses =
        "bg-[#596B58] hover:bg-[#465545] text-white font-bold rounded-xl shadow-xs transition-all active:scale-95";
      break;
    case "pill":
      variantClasses =
        "bg-[#FFF8EC] hover:bg-[#F7F2E7] text-[#596B58] border border-[#596B58]/30 font-bold rounded-full transition-all active:scale-95 shadow-2xs";
      break;
    case "ghost":
      variantClasses =
        "text-[#7A6E65] hover:text-[#596B58] hover:bg-[#A8B89A]/15 font-bold rounded-xl transition-all";
      break;
    case "outline":
    default:
      variantClasses =
        "bg-white hover:bg-[#FFF8EC] border border-[#E5DEC9] hover:border-[#596B58] text-[#3B302B] hover:text-[#596B58] font-bold rounded-xl shadow-2xs transition-all active:scale-95";
      break;
  }

  // Size styles
  let sizeClasses = "px-3 py-1.5 text-xs";
  let iconSize = "h-4 w-4";
  if (variant === "floating") {
    sizeClasses = "p-2.5 sm:p-3";
    iconSize = "h-4.5 w-4.5 sm:h-5 sm:w-5";
  } else if (size === "sm") {
    sizeClasses = "px-2.5 py-1 text-[11px]";
    iconSize = "h-3.5 w-3.5";
  } else if (size === "lg") {
    sizeClasses = "px-4 py-2.5 text-sm";
    iconSize = "h-5 w-5";
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Share ${product.name}`}
        title={`Share ${product.name}`}
        className={`inline-flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation select-none ${sizeClasses} ${variantClasses} ${className}`}
      >
        <Share2 className={iconSize} />
        {showLabel && variant !== "floating" && <span>{label}</span>}
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  );
};
