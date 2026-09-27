import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { setAppLanguage, type SupportedLanguage } from "@/i18n";

export interface LanguageSwitcherProps {
  className?: string;
  variant?: "desktop" | "mobile" | "compact";
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = "",
  variant = "desktop",
}) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language === "hi" ? "hi" : "en") as SupportedLanguage;

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    if (lang === currentLang) return;
    setAppLanguage(lang);
  };

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center rounded-xl bg-white border border-[#E5DEC9] p-0.5 shadow-2xs text-[11px] font-bold ${className}`}
        role="group"
        aria-label="Language selector"
      >
        <button
          type="button"
          onClick={() => handleSelectLanguage("en")}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
            currentLang === "en"
              ? "bg-[#596B58] text-[#FFF8EC] shadow-xs font-black"
              : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]"
          }`}
          aria-pressed={currentLang === "en"}
        >
          EN
        </button>
        <span className="text-[#E5DEC9] select-none">|</span>
        <button
          type="button"
          onClick={() => handleSelectLanguage("hi")}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
            currentLang === "hi"
              ? "bg-[#596B58] text-[#FFF8EC] shadow-xs font-black"
              : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]"
          }`}
          aria-pressed={currentLang === "hi"}
        >
          हिंदी
        </button>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] shadow-2xs ${className}`}
        role="group"
        aria-label="Language selector"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-[#3B302B]">
          <Globe className="h-4 w-4 text-[#596B58]" />
          <span>भाषा / Language</span>
        </div>
        <div className="inline-flex rounded-xl bg-white border border-[#E5DEC9] p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => handleSelectLanguage("en")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentLang === "en"
                ? "bg-[#596B58] text-[#FFF8EC] shadow-xs"
                : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleSelectLanguage("hi")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentLang === "hi"
                ? "bg-[#596B58] text-[#FFF8EC] shadow-xs"
                : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]"
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-xl bg-white border border-[#E5DEC9] text-xs shadow-2xs group ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <Globe className="h-3.5 w-3.5 text-[#596B58] ml-1 shrink-0" />
      <button
        type="button"
        onClick={() => handleSelectLanguage("en")}
        className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
          currentLang === "en"
            ? "bg-[#596B58] text-[#FFF8EC] shadow-xs"
            : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]"
        }`}
        aria-pressed={currentLang === "en"}
      >
        EN
      </button>
      <span className="text-[#E5DEC9] text-xs font-light select-none">|</span>
      <button
        type="button"
        onClick={() => handleSelectLanguage("hi")}
        className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
          currentLang === "hi"
            ? "bg-[#596B58] text-[#FFF8EC] shadow-xs"
            : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]"
        }`}
        aria-pressed={currentLang === "hi"}
      >
        हिंदी
      </button>
    </div>
  );
};
