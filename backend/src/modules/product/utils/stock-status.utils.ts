import type { StockStatus } from "../constants/index.js";

export interface CalculateStockStatusParams {
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  explicitStockStatus?: StockStatus;
}

export function calculateStockStatus(
  params: CalculateStockStatusParams,
): StockStatus {
  if (params.explicitStockStatus) {
    return params.explicitStockStatus;
  }

  if (!params.trackInventory) {
    return "IN_STOCK";
  }

  if (params.stockQuantity > params.lowStockThreshold) {
    return "IN_STOCK";
  }

  if (params.stockQuantity > 0) {
    return "LOW_STOCK";
  }

  if (params.allowBackorder) {
    return "PRE_ORDER";
  }

  return "OUT_OF_STOCK";
}
