export const PRODUCT_TYPES = ["NORMAL", "COMBO", "CUSTOM_CAKE"] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];
