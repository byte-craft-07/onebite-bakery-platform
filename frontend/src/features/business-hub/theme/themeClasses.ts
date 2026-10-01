export interface ThemeConfig {
  containerBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  primaryBtn: string;
  primaryBtnText: string;
  secondaryBtn: string;
  secondaryBtnText: string;
  accentBadge: string;
  accentBadgeText: string;
  cardHover: string;
}

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  onebite_premium: {
    containerBg: "bg-[#FDFBF7]",
    cardBg: "bg-[#FFFFFF]",
    cardBorder: "border-[#EFE8DF]",
    textPrimary: "text-[#3B302B]",
    textSecondary: "text-[#7A6B63]",
    primaryBtn: "bg-[#3B302B] hover:bg-[#2A221E] active:scale-[0.98]",
    primaryBtnText: "text-[#FFF8EC]",
    secondaryBtn: "bg-[#FFF8EC] hover:bg-[#F7EEDD] border border-[#E8DFC8] active:scale-[0.98]",
    secondaryBtnText: "text-[#3B302B]",
    accentBadge: "bg-[#EAF2EC]",
    accentBadgeText: "text-[#2B613B]",
    cardHover: "hover:border-[#D4A373] hover:shadow-md",
  },
  minimal_cream: {
    containerBg: "bg-[#FAF7F2]",
    cardBg: "bg-[#FFFFFF]",
    cardBorder: "border-[#EDE4DA]",
    textPrimary: "text-[#292524]",
    textSecondary: "text-[#78716C]",
    primaryBtn: "bg-[#D97706] hover:bg-[#B45309] active:scale-[0.98]",
    primaryBtnText: "text-white",
    secondaryBtn: "bg-[#FFFFFF] hover:bg-[#F5F5F4] border border-[#E7E5E4] active:scale-[0.98]",
    secondaryBtnText: "text-[#292524]",
    accentBadge: "bg-[#FEF3C7]",
    accentBadgeText: "text-[#92400E]",
    cardHover: "hover:border-[#D97706] hover:shadow-md",
  },
  pistachio_bakery: {
    containerBg: "bg-[#F3F7F4]",
    cardBg: "bg-[#FFFFFF]",
    cardBorder: "border-[#DFEBE2]",
    textPrimary: "text-[#1E3A2F]",
    textSecondary: "text-[#547366]",
    primaryBtn: "bg-[#2D5A46] hover:bg-[#214334] active:scale-[0.98]",
    primaryBtnText: "text-white",
    secondaryBtn: "bg-[#EBF3EE] hover:bg-[#DEECE3] border border-[#CFDFD5] active:scale-[0.98]",
    secondaryBtnText: "text-[#1E3A2F]",
    accentBadge: "bg-[#DCEDE2]",
    accentBadgeText: "text-[#1C4E36]",
    cardHover: "hover:border-[#2D5A46] hover:shadow-md",
  },
  chocolate_cream: {
    containerBg: "bg-[#251D18]",
    cardBg: "bg-[#332822]",
    cardBorder: "border-[#483A32]",
    textPrimary: "text-[#FFF8EC]",
    textSecondary: "text-[#D3C3B7]",
    primaryBtn: "bg-[#E0A96D] hover:bg-[#CA9458] active:scale-[0.98]",
    primaryBtnText: "text-[#251D18]",
    secondaryBtn: "bg-[#42342C] hover:bg-[#4E3E34] border border-[#59463B] active:scale-[0.98]",
    secondaryBtnText: "text-[#FFF8EC]",
    accentBadge: "bg-[#4E3E34]",
    accentBadgeText: "text-[#E0A96D]",
    cardHover: "hover:border-[#E0A96D] hover:shadow-lg",
  },
};
