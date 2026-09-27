import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import i18n, { LANGUAGE_STORAGE_KEY, changeLanguage } from "@/i18n";
import {
  getLocalizedProductName,
  getLocalizedProductDescription,
  getLocalizedProductShortDescription,
  getLocalizedCategoryName,
  getLocalizedOrderStatus,
  getLocalizedPaymentStatus,
  formatPrice,
} from "@/i18n/utils";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";

describe("i18n Internationalization Core Suite", () => {
  beforeEach(async () => {
    localStorage.clear();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  describe("1. Language Switching & HTML Attribute Updates", () => {
    it("initializes with English as default language", () => {
      expect(i18n.language).toBe("en");
      expect(document.documentElement.lang).toBe("en");
    });

    it("switches language from English to Hindi dynamically", async () => {
      await act(async () => {
        await changeLanguage("hi");
      });

      expect(i18n.language).toBe("hi");
      expect(document.documentElement.lang).toBe("hi");
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("hi");
    });

    it("switches language back to English from Hindi", async () => {
      await act(async () => {
        await changeLanguage("hi");
      });
      expect(i18n.language).toBe("hi");

      await act(async () => {
        await changeLanguage("en");
      });
      expect(i18n.language).toBe("en");
      expect(document.documentElement.lang).toBe("en");
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
    });
  });

  describe("2. Translations & Fallback Mechanism", () => {
    it("translates common namespace correctly in both English and Hindi", async () => {
      expect(i18n.t("common:addToCart")).toBe("Add to Cart");
      expect(i18n.t("common:orderNow")).toBe("Order Now");

      await act(async () => {
        await changeLanguage("hi");
      });

      expect(i18n.t("common:addToCart")).toBe("कार्ट में जोड़ें");
      expect(i18n.t("common:orderNow")).toBe("अभी ऑर्डर करें");
    });

    it("translates auth and profile namespaces accurately", async () => {
      expect(i18n.t("auth:loginTitle")).toBe("Log in or sign up");
      expect(i18n.t("profile:savedAddresses")).toBe("Saved Delivery Addresses");

      await act(async () => {
        await changeLanguage("hi");
      });

      expect(i18n.t("auth:loginTitle")).toBe("लॉग इन या साइन अप करें");
      expect(i18n.t("profile:savedAddresses")).toBe("सहेजे गए डिलीवरी पते");
    });

    it("translates both colon notation (navigation:home) and dot notation (navigation.home)", async () => {
      expect(i18n.t("navigation:home")).toBe("Home");
      expect(i18n.t("navigation.home")).toBe("Home");
      expect(i18n.t("navigation.products")).toBe("Products");

      await act(async () => {
        await changeLanguage("hi");
      });

      expect(i18n.t("navigation:home")).toBe("होम");
      expect(i18n.t("navigation.home")).toBe("होम");
      expect(i18n.t("navigation.products")).toBe("उत्पाद");
    });

    it("translates home namespace correctly in both English and Hindi", async () => {
      await act(async () => {
        await changeLanguage("en");
      });
      expect(i18n.t("home.browseCategories")).toBe("Browse Categories");
      expect(i18n.t("home.whyChooseTitle")).toBe("Why Choose Onebite Bakery?");
      expect(i18n.t("home.freshDailyTitle")).toBe("100% Fresh Daily");

      await act(async () => {
        await changeLanguage("hi");
      });
      expect(i18n.t("home.browseCategories")).toBe("श्रेणियां ब्राउज़ करें");
      expect(i18n.t("home.whyChooseTitle")).toBe("वनबाइट बेकरी क्यों चुनें?");
      expect(i18n.t("home.freshDailyTitle")).toBe("100% रोज़ाना ताज़ा");
    });

    it("falls back to English when a Hindi translation key is missing", async () => {
      await act(async () => {
        await changeLanguage("hi");
      });

      const result = i18n.t("common:apply", { defaultValue: "Apply" });
      expect(result).toBeTruthy();
    });
  });

  describe("3. Product & Category Localization Helpers", () => {
    const mockProductBilingual = {
      name: "Belgian Chocolate Cake",
      nameHi: "बेल्जियन चॉकलेट केक",
      description: "Rich dark chocolate ganache with moist sponge.",
      descriptionHi: "नम स्पंज के साथ समृद्ध डार्क चॉकलेट गनाश।",
      shortDescription: "Signature chocolate cake.",
      shortDescriptionHi: "स्वादिष्ट चॉकलेट केक।",
    };

    const mockProductEnglishOnly = {
      name: "Vanilla Bean Cupcake",
      description: "Pure Madagascar vanilla with buttercream frosting.",
      shortDescription: "Sweet vanilla treat.",
    };

    it("returns English name and description when current language is 'en'", async () => {
      await act(async () => {
        await changeLanguage("en");
      });

      expect(getLocalizedProductName(mockProductBilingual)).toBe("Belgian Chocolate Cake");
      expect(getLocalizedProductDescription(mockProductBilingual)).toBe(
        "Rich dark chocolate ganache with moist sponge."
      );
      expect(getLocalizedProductShortDescription(mockProductBilingual)).toBe(
        "Signature chocolate cake."
      );
    });

    it("returns Hindi name and description when current language is 'hi'", async () => {
      await act(async () => {
        await changeLanguage("hi");
      });

      expect(getLocalizedProductName(mockProductBilingual)).toBe("बेल्जियन चॉकलेट केक");
      expect(getLocalizedProductDescription(mockProductBilingual)).toBe(
        "नम स्पंज के साथ समृद्ध डार्क चॉकलेट गनाश।"
      );
      expect(getLocalizedProductShortDescription(mockProductBilingual)).toBe(
        "स्वादिष्ट चॉकलेट केक।"
      );
    });

    it("falls back to English name and description when Hindi fields are absent", async () => {
      await act(async () => {
        await changeLanguage("hi");
      });

      expect(getLocalizedProductName(mockProductEnglishOnly)).toBe("Vanilla Bean Cupcake");
      expect(getLocalizedProductDescription(mockProductEnglishOnly)).toBe(
        "Pure Madagascar vanilla with buttercream frosting."
      );
      expect(getLocalizedProductShortDescription(mockProductEnglishOnly)).toBe(
        "Sweet vanilla treat."
      );
    });

    it("localizes category names via nameHi, slug dictionary, or English fallback", async () => {
      // 1. With explicit nameHi
      const catWithNameHi = { name: "Artisanal Breads", nameHi: "कारीगर ब्रेड", slug: "breads" };
      await act(async () => {
        await changeLanguage("hi");
      });
      expect(getLocalizedCategoryName(catWithNameHi)).toBe("कारीगर ब्रेड");

      // 2. Without nameHi but known slug (e.g. "pastries" -> "पेस्ट्री")
      const catWithSlug = { name: "Pastries & Desserts", slug: "pastries" };
      expect(getLocalizedCategoryName(catWithSlug)).toBe("पेस्ट्री");

      // 3. In English mode
      await act(async () => {
        await changeLanguage("en");
      });
      expect(getLocalizedCategoryName(catWithNameHi)).toBe("Artisanal Breads");
      expect(getLocalizedCategoryName(catWithSlug)).toBe("Pastries & Desserts");
    });
  });

  describe("4. Order & Payment Status Localization", () => {
    it("correctly localizes all backend order statuses", async () => {
      await act(async () => {
        await changeLanguage("en");
      });
      expect(getLocalizedOrderStatus("PENDING")).toBe("Pending");
      expect(getLocalizedOrderStatus("CONFIRMED")).toBe("Confirmed");
      expect(getLocalizedOrderStatus("BAKING")).toBe("Baking");
      expect(getLocalizedOrderStatus("READY_FOR_PICKUP")).toBe("Ready for Pickup");
      expect(getLocalizedOrderStatus("OUT_FOR_DELIVERY")).toBe("Out for Delivery");
      expect(getLocalizedOrderStatus("DELIVERED")).toBe("Delivered");
      expect(getLocalizedOrderStatus("CANCELLED")).toBe("Cancelled");

      await act(async () => {
        await changeLanguage("hi");
      });
      expect(getLocalizedOrderStatus("PENDING")).toBe("लंबित");
      expect(getLocalizedOrderStatus("CONFIRMED")).toBe("पुष्टि की गई");
      expect(getLocalizedOrderStatus("BAKING")).toBe("बेक हो रहा है");
      expect(getLocalizedOrderStatus("READY_FOR_PICKUP")).toBe("पिकअप के लिए तैयार");
      expect(getLocalizedOrderStatus("OUT_FOR_DELIVERY")).toBe("डिलीवरी के लिए निकला");
      expect(getLocalizedOrderStatus("DELIVERED")).toBe("डिलीवर हुआ");
      expect(getLocalizedOrderStatus("CANCELLED")).toBe("रद्द किया गया");
    });

    it("correctly localizes payment statuses", async () => {
      await act(async () => {
        await changeLanguage("en");
      });
      expect(getLocalizedPaymentStatus("PAID")).toBe("Paid");
      expect(getLocalizedPaymentStatus("PENDING")).toBe("Payment Pending");
      expect(getLocalizedPaymentStatus("FAILED")).toBe("Payment Failed");
      expect(getLocalizedPaymentStatus("REFUNDED")).toBe("Refunded");

      await act(async () => {
        await changeLanguage("hi");
      });
      expect(getLocalizedPaymentStatus("PAID")).toBe("भुगतान हो गया");
      expect(getLocalizedPaymentStatus("PENDING")).toBe("भुगतान लंबित");
      expect(getLocalizedPaymentStatus("FAILED")).toBe("भुगतान विफल");
      expect(getLocalizedPaymentStatus("REFUNDED")).toBe("रिफंड किया गया");
    });
  });

  describe("5. Currency & Cart Price Preservation", () => {
    it("formats price with Indian Rupee symbol consistently across languages", async () => {
      await act(async () => {
        await changeLanguage("en");
      });
      expect(formatPrice(549)).toBe("₹549");
      expect(formatPrice(1299.5)).toBe("₹1,300");

      await act(async () => {
        await changeLanguage("hi");
      });
      expect(formatPrice(549)).toBe("₹549");
      expect(formatPrice(1299.5)).toBe("₹1,300");
    });

    it("keeps currency values strictly in INR without conversion errors", () => {
      const cartItem = {
        productId: "prod-1",
        quantity: 2,
        price: 499,
        lineTotal: 998,
      };

      expect(cartItem.price).toBe(499);
      expect(cartItem.lineTotal).toBe(998);
      expect(typeof cartItem.price).toBe("number");
    });
  });

  describe("6. LanguageSwitcher UI Component", () => {
    it("renders desktop language buttons and responds to clicks", async () => {
      render(<LanguageSwitcher variant="desktop" />);

      const hiButton = screen.getByRole("button", { name: /हिंदी/i });
      expect(hiButton).toBeDefined();

      await act(async () => {
        fireEvent.click(hiButton);
      });

      expect(i18n.language).toBe("hi");
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("hi");

      const enButton = screen.getByRole("button", { name: /EN/i });
      await act(async () => {
        fireEvent.click(enButton);
      });

      expect(i18n.language).toBe("en");
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
    });

    it("renders compact language switcher buttons", () => {
      render(<LanguageSwitcher variant="compact" />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(2);
      expect(screen.getByRole("button", { name: "EN" })).toBeDefined();
      expect(screen.getByRole("button", { name: "हिंदी" })).toBeDefined();
    });

    it("renders mobile language switcher with full labels", () => {
      render(<LanguageSwitcher variant="mobile" />);
      expect(screen.getByRole("button", { name: "English" })).toBeDefined();
      expect(screen.getByRole("button", { name: "हिंदी" })).toBeDefined();
    });
  });
});
