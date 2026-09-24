/**
 * Canonical product share URL generator
 */
export function buildProductShareUrl(
  productSlugOrId: string,
  customBaseUrl?: string,
): string {
  if (!productSlugOrId || typeof productSlugOrId !== "string") {
    return typeof window !== "undefined" ? window.location.href : "https://onebitebakery.com";
  }

  const cleanSlug = productSlugOrId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let origin = "";

  if (customBaseUrl && customBaseUrl.trim()) {
    origin = customBaseUrl.trim().replace(/\/+$/, "");
  } else if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_PUBLIC_BASE_URL
  ) {
    origin = String(import.meta.env.VITE_PUBLIC_BASE_URL).replace(/\/+$/, "");
  } else if (typeof window !== "undefined" && window.location?.origin) {
    origin = window.location.origin;
  } else {
    origin = "https://onebitebakery.com";
  }

  return `${origin}/products/${cleanSlug}`;
}
