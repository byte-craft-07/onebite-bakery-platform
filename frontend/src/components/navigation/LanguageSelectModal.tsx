import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe, Sparkles, X, ArrowRight } from "lucide-react";
import { setAppLanguage, type SupportedLanguage, LANGUAGE_STORAGE_KEY, LANGUAGE_CONFIRMED_KEY } from "@/i18n";

interface LanguageSelectModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  /** When true, user cannot dismiss without selecting a language */
  required?: boolean;
}

export const LanguageSelectModal: React.FC<LanguageSelectModalProps> = ({
  isOpen: externalIsOpen,
  onClose,
  required = true,
}) => {
  const { i18n } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(
    (i18n.language === "hi" ? "hi" : "en") as SupportedLanguage
  );

  const isControlled = externalIsOpen !== undefined;
  const showModal = isControlled ? externalIsOpen : internalIsOpen;

  // Check on mount if user has already confirmed language preference
  useEffect(() => {
    if (!isControlled) {
      try {
        const confirmed = localStorage.getItem(LANGUAGE_CONFIRMED_KEY);
        if (!confirmed) {
          setInternalIsOpen(true);
        }
      } catch {
        // Fallback if localStorage is inaccessible
      }
    }

    const handleOpenEvent = () => {
      setInternalIsOpen(true);
    };

    window.addEventListener("onebitebakery_open_language_modal", handleOpenEvent);
    return () => {
      window.removeEventListener("onebitebakery_open_language_modal", handleOpenEvent);
    };
  }, [isControlled]);

  // Keep selectedLang in sync with current i18n language
  useEffect(() => {
    const current = (i18n.language === "hi" ? "hi" : "en") as SupportedLanguage;
    setSelectedLang(current);
  }, [i18n.language, showModal]);

  const handleConfirm = () => {
    setAppLanguage(selectedLang);
    try {
      localStorage.setItem(LANGUAGE_CONFIRMED_KEY, "true");
    } catch {
      // Ignore storage errors
    }

    if (!isControlled) {
      setInternalIsOpen(false);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleDismiss = () => {
    // Only allow dismissal if already confirmed previously and not required
    const alreadyConfirmed = localStorage.getItem(LANGUAGE_CONFIRMED_KEY) === "true";
    if (alreadyConfirmed && !required) {
      if (!isControlled) setInternalIsOpen(false);
      if (onClose) onClose();
    }
  };

  if (!showModal) return null;

  const alreadyConfirmed = typeof window !== "undefined" && localStorage.getItem(LANGUAGE_CONFIRMED_KEY) === "true";
  const canClose = alreadyConfirmed && !required;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && canClose) {
          handleDismiss();
        }
      }}
    >
      <div
        className="w-full max-w-md bg-[#FFF8EC] rounded-3xl border border-[#E5DEC9] shadow-2xl p-6 sm:p-7 relative overflow-hidden transition-all transform scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Optional Close button only if previously confirmed */}
        {canClose && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#E5DEC9]/40 transition-colors cursor-pointer"
            aria-label="Close language selector"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Decorative Top Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#596B58]/10 border border-[#596B58]/20 flex items-center justify-center mb-3 text-[#596B58] shadow-inner">
            <Globe className="h-7 w-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A8B89A]/20 border border-[#A8B89A]/30 text-[#596B58] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Language Preference &bull; भाषा प्राथमिकता</span>
          </div>
          <h2
            id="language-modal-title"
            className="text-xl sm:text-2xl font-black text-[#3B302B] tracking-tight leading-tight"
          >
            Select Your Language <br />
            <span className="text-base sm:text-lg font-bold text-[#596B58]">अपनी पसंदीदा भाषा चुनें</span>
          </h2>
          <p className="text-xs text-[#7A6E65] mt-1.5 max-w-xs">
            Please choose a language to personalize your bakery shopping experience.
          </p>
        </div>

        {/* Language Options */}
        <div className="space-y-3 mb-6">
          {/* English Option */}
          <button
            type="button"
            onClick={() => setSelectedLang("en")}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedLang === "en"
                ? "bg-white border-[#596B58] shadow-md ring-2 ring-[#596B58]/30 scale-[1.01]"
                : "bg-white/60 hover:bg-white border-[#E5DEC9] text-[#7A6E65]"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${
                  selectedLang === "en"
                    ? "bg-[#596B58] text-[#FFF8EC]"
                    : "bg-[#E5DEC9]/40 text-[#3B302B]"
                }`}
              >
                EN
              </div>
              <div>
                <p className="text-base font-bold text-[#3B302B]">English</p>
                <p className="text-xs text-[#7A6E65]">Browse and order in English</p>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                selectedLang === "en"
                  ? "border-[#596B58] bg-[#596B58] text-white"
                  : "border-[#E5DEC9] bg-transparent"
              }`}
            >
              {selectedLang === "en" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
            </div>
          </button>

          {/* Hindi Option */}
          <button
            type="button"
            onClick={() => setSelectedLang("hi")}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedLang === "hi"
                ? "bg-white border-[#596B58] shadow-md ring-2 ring-[#596B58]/30 scale-[1.01]"
                : "bg-white/60 hover:bg-white border-[#E5DEC9] text-[#7A6E65]"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${
                  selectedLang === "hi"
                    ? "bg-[#596B58] text-[#FFF8EC]"
                    : "bg-[#E5DEC9]/40 text-[#3B302B]"
                }`}
              >
                हिं
              </div>
              <div>
                <p className="text-base font-bold text-[#3B302B]">हिन्दी (Hindi)</p>
                <p className="text-xs text-[#7A6E65]">अपनी मातृभाषा हिंदी में ऑर्डर करें</p>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                selectedLang === "hi"
                  ? "border-[#596B58] bg-[#596B58] text-white"
                  : "border-[#E5DEC9] bg-transparent"
              }`}
            >
              {selectedLang === "hi" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#596B58] hover:bg-[#495948] active:scale-[0.99] text-[#FFF8EC] font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{selectedLang === "hi" ? "आगे बढ़ें (Continue)" : "Continue ; आगे बढ़ें"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Bottom Note */}
        <p className="text-[11px] text-center text-[#7A6E65] mt-3">
          {selectedLang === "hi"
            ? "आप इसे बाद में साइड मेनू या फ़ुटर से कभी भी बदल सकते हैं।"
            : "You can change your language anytime from the menu or footer."}
        </p>
      </div>
    </div>
  );
};
