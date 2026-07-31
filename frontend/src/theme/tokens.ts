export const DESIGN_TOKENS = {
  colors: {
    background: "#FFFBF5",
    surface: "#FFFFFF",
    surfaceMuted: "#F9F6F0",
    primary: "#E67E22",
    primaryHover: "#D35400",
    secondary: "#2C1E16",
    accentRose: "#C0392B",
    success: "#27AE60",
    warning: "#F39C12",
    danger: "#E74C3C",
    border: "#E8E2D9",
  },
  borderRadius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    full: "9999px",
  },
  shadows: {
    card: "0 4px 16px rgba(44, 30, 22, 0.08)",
    hover: "0 12px 32px rgba(44, 30, 22, 0.12)",
    modal: "0 24px 48px rgba(44, 30, 22, 0.18)",
  },
} as const;
