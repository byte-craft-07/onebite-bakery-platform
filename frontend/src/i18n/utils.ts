import i18n from "./index";

const CATEGORY_MAP_HI: Record<string, string> = {
  cakes: "केक",
  "birthday-cakes": "जन्मदिन के केक",
  combos: "कॉम्बो",
  pastries: "पेस्ट्री",
  cookies: "कुकीज़",
  breads: "ब्रेड",
  cupcakes: "कपकेक",
  "dry-cakes": "ड्राय केक",
  "festive-cakes": "त्योहार केक",
  "anniversary-cakes": "सालगिरह केक",
  decorations: "सजावट सामान",
  snacks: "स्नैक्स",
  beverages: "पेय पदार्थ",
};

export const getLocalizedProductName = (
  product: { name?: string; nameHi?: string } | null | undefined,
  lang: string = i18n.language
): string => {
  if (!product) return "";
  if (lang === "hi" && product.nameHi && product.nameHi.trim()) {
    return product.nameHi.trim();
  }
  return product.name || "";
};

export const getLocalizedProductDescription = (
  product: { description?: string; descriptionHi?: string } | null | undefined,
  lang: string = i18n.language
): string => {
  if (!product) return "";
  if (lang === "hi" && product.descriptionHi && product.descriptionHi.trim()) {
    return product.descriptionHi.trim();
  }
  return product.description || "";
};

export const getLocalizedProductShortDescription = (
  product: { shortDescription?: string; shortDescriptionHi?: string } | null | undefined,
  lang: string = i18n.language
): string => {
  if (!product) return "";
  if (lang === "hi" && product.shortDescriptionHi && product.shortDescriptionHi.trim()) {
    return product.shortDescriptionHi.trim();
  }
  return product.shortDescription || "";
};

export const getLocalizedCategoryName = (
  category: { name: string; nameHi?: string; slug?: string } | null | undefined,
  lang: string = i18n.language
): string => {
  if (!category) return "";
  if (lang === "hi") {
    if (category.nameHi && category.nameHi.trim()) {
      return category.nameHi.trim();
    }
    const slug = (category.slug || "").toLowerCase();
    if (CATEGORY_MAP_HI[slug]) {
      return CATEGORY_MAP_HI[slug];
    }
    const nameLower = (category.name || "").toLowerCase().trim();
    if (CATEGORY_MAP_HI[nameLower]) {
      return CATEGORY_MAP_HI[nameLower];
    }
  }
  return category.name || "";
};

export const getLocalizedOrderStatus = (
  status: string | null | undefined,
  t?: (key: string, opts?: any) => string
): string => {
  if (!status) return "";
  const translateFn = t || ((k: string, o?: any) => i18n.t(k, o));
  const key = `orders:statuses.${status}`;
  const translated = String(translateFn(key));
  if (translated && translated !== key) return translated;
  const scopedKey = `statuses.${status}`;
  const scopedTranslated = String(translateFn(scopedKey));
  if (scopedTranslated && scopedTranslated !== scopedKey) return scopedTranslated;
  return status;
};

export const getLocalizedPaymentStatus = (
  status: string | null | undefined,
  t?: (key: string, opts?: any) => string
): string => {
  if (!status) return "";
  const translateFn = t || ((k: string, o?: any) => i18n.t(k, o));
  const key = `orders:paymentStatuses.${status}`;
  const translated = String(translateFn(key));
  if (translated && translated !== key) return translated;
  const scopedKey = `paymentStatuses.${status}`;
  const scopedTranslated = String(translateFn(scopedKey));
  if (scopedTranslated && scopedTranslated !== scopedKey) return scopedTranslated;
  return status;
};

export const formatPrice = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
};
