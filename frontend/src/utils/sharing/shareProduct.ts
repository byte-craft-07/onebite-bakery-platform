import { apiClient } from "@/services/api.client";
import { buildShareMessage, type ShareableProductInfo } from "./buildShareMessage";

export type ShareChannel =
  | "native"
  | "whatsapp"
  | "whatsapp_status"
  | "instagram_story"
  | "telegram"
  | "facebook"
  | "x"
  | "copy_link";

/**
 * Check if Web Share API is available
 */
export function isNativeShareSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/**
 * Check if Web Share API can share specific files (e.g. product image)
 */
export function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

/**
 * Copies text to clipboard with modern Clipboard API and fallback textarea
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea fallback
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Fetches an image URL and converts it into a File object for Web Share API
 */
export async function fetchImageAsFile(
  imageUrl: string,
  filename = "bakery-product.jpg",
): Promise<File | null> {
  if (!imageUrl || typeof window === "undefined") return null;

  try {
    const response = await fetch(imageUrl, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const mimeType = blob.type || "image/jpeg";
    const extension = mimeType.includes("png")
      ? "png"
      : mimeType.includes("webp")
      ? "webp"
      : "jpg";
    const cleanFilename = filename.endsWith(`.${extension}`)
      ? filename
      : `${filename.replace(/\.[^/.]+$/, "")}.${extension}`;

    return new File([blob], cleanFilename, { type: mimeType });
  } catch {
    return null;
  }
}

/**
 * Downloads a product image directly to the user's device/gallery
 */
export async function downloadProductImage(
  imageUrl: string,
  filename = "bakery-product.jpg",
): Promise<boolean> {
  if (!imageUrl || typeof window === "undefined") return false;

  try {
    const response = await fetch(imageUrl, { mode: "cors" });
    if (!response.ok) throw new Error("Image fetch failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    return true;
  } catch {
    // Fallback direct anchor download
    const link = document.createElement("a");
    link.href = imageUrl;
    link.target = "_blank";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}

/**
 * Generate platform-specific sharing links
 */
export function getWhatsAppShareUrl(fullMessage: string): string {
  return `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
}

export function getWhatsAppWebShareUrl(fullMessage: string): string {
  return `https://web.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
}

export function getTelegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getXShareUrl(url: string, text: string): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Asynchronously record share event to backend analytics (non-blocking)
 */
export function recordShareAnalytics(
  productId: string | undefined,
  productSlug: string,
  productName: string | undefined,
  shareMethod: ShareChannel,
): void {
  try {
    apiClient
      .post("/products/share-event", {
        productId: productId || undefined,
        productSlug: productSlug.toLowerCase().trim(),
        productName: productName?.trim(),
        shareMethod,
      })
      .catch(() => {
        // Analytics failure must never disrupt UX
      });
  } catch {
    // Non-blocking
  }
}

/**
 * Triggers native OS share sheet if supported, attaching product image file when available
 */
export async function shareNative(
  product: ShareableProductInfo,
  files?: File[],
): Promise<{ success: boolean; aborted?: boolean; error?: string }> {
  if (!isNativeShareSupported()) {
    return { success: false, error: "Native sharing not supported on this browser." };
  }

  const bundle = buildShareMessage(product);

  let shareFiles = files;
  if (!shareFiles && product.mainImage) {
    const file = await fetchImageAsFile(
      product.mainImage,
      `${product.slug || "bakery-product"}.jpg`,
    );
    if (file && canShareFiles([file])) {
      shareFiles = [file];
    }
  }

  const shareData: ShareData = {
    title: bundle.title,
    text: bundle.fullMessage,
    url: bundle.url,
  };

  if (shareFiles && shareFiles.length > 0 && canShareFiles(shareFiles)) {
    shareData.files = shareFiles;
  }

  try {
    await navigator.share(shareData);
    recordShareAnalytics(product.id, product.slug || product.name, product.name, "native");
    return { success: true };
  } catch (err: any) {
    // AbortError is normal user cancellation — do not treat as an error
    if (err?.name === "AbortError") {
      return { success: false, aborted: true };
    }
    return { success: false, error: err?.message || "Share failed." };
  }
}
