import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import hi from "./locales/hi";

export const LANGUAGE_STORAGE_KEY = "onebitebakery_language";
export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "hi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const getSavedLanguage = (): SupportedLanguage => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "hi") {
      return saved;
    }
  } catch {
    // Ignore localStorage access errors
  }
  return DEFAULT_LANGUAGE;
};

const initialLang = getSavedLanguage();

if (typeof document !== "undefined") {
  document.documentElement.lang = initialLang;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      hi,
    },
    lng: initialLang,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: [
      "common",
      "home",
      "navigation",
      "auth",
      "cart",
      "checkout",
      "orders",
      "products",
      "profile",
      "reviews",
      "admin",
      "validation",
      "notifications",
    ],
    defaultNS: "common",
    fallbackNS: [
      "common",
      "home",
      "navigation",
      "auth",
      "cart",
      "checkout",
      "orders",
      "products",
      "profile",
      "reviews",
      "admin",
      "validation",
      "notifications",
    ],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Avoid blocking render if async loading
    },
  });

export const setAppLanguage = (lang: SupportedLanguage): void => {
  if (lang !== "en" && lang !== "hi") return;
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("onebitebakery_language_changed", { detail: { language: lang } })
    );
  }
};

export const changeLanguage = setAppLanguage;

export const getCurrentLanguage = (): SupportedLanguage => {
  const current = i18n.language;
  return current === "hi" ? "hi" : "en";
};

export default i18n;
