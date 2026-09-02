import type { ProductType, StockStatus } from "../constants/index.js";
import type { ComboItemDto } from "../dto/index.js";

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  categoryId: string;
  occasionIds: string[];
  productType: ProductType;
  comboItems?: ComboItemDto[];
  price: number;
  compareAtPrice?: number;
  taxCategory?: string;
  imageUrls: string[];
  thumbnailUrl: string;
  stockStatus: StockStatus;
  stockQuantity?: number;
  branchSnapshot?: {
    branchId: string;
    name: string;
    code: string;
  };
  isAvailable: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isRecommended: boolean;
  isSeasonal: boolean;
  deliveryEligible: boolean;
  pickupEligible: boolean;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductInventoryResponse {
  id: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  taxCategory?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  stockStatus: StockStatus;
  isAvailable: boolean;
  deliveryEligible: boolean;
  pickupEligible: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
}
