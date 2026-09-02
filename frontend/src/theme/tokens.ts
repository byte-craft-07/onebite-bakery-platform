export const DESIGN_TOKENS = {
  colors: {
    // Official Brand Palette
    cream: "#FFF8EC",
    pistachio: "#A8B89A",
    sage: "#596B58",
    cocoa: "#3B302B",
    champagne: "#D8BE91",

    // Semantic tokens
    background: "#FFF8EC",
    backgroundSecondary: "#FAF3E6",
    surface: "#FFFFFF",
    surfaceMuted: "#F7F2E7",
    surfaceElevated: "#FFFFFF",

    textPrimary: "#3B302B",
    textSecondary: "#596B58",
    textMuted: "#7A6E65",
    textInverse: "#FFF8EC",

    brandPrimary: "#A8B89A",
    brandSecondary: "#596B58",
    brandAccent: "#D8BE91",

    border: "#E5DEC9",
    borderSubtle: "#F0EAD6",

    buttonPrimary: "#596B58",
    buttonPrimaryHover: "#495948",
    buttonSecondary: "#FFF8EC",
    buttonSecondaryHover: "#A8B89A",

    // Functional tokens
    success: "#2E7D32",
    warning: "#D97706",
    danger: "#DC2626",
    info: "#0284C7",
  },
  borderRadius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    full: "9999px",
  },
  shadows: {
    card: "0 2px 12px rgba(59, 48, 43, 0.05)",
    hover: "0 8px 24px rgba(59, 48, 43, 0.09)",
    modal: "0 20px 40px rgba(59, 48, 43, 0.15)",
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;

