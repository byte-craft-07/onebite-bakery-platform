export const PRODUCT_TYPES = ["NORMAL", "COMBO", "CUSTOM_CAKE"] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const STOCK_STATUSES = [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "PRE_ORDER",
] as const;

export type StockStatus = (typeof STOCK_STATUSES)[number];
