import type { ProductType, StockStatus } from "../constants/index.js";

export interface ComboItemDto {
  productId: string;
  quantity: number;
}

export interface CreateProductDto {
  name: string;
  slug?: string;
  shortDescription?: string;
  description: string;
  categoryId: string;
  occasionIds: string[];
  productType: ProductType;
  comboItems: ComboItemDto[];
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  taxCategory?: string;
  imageUrls: string[];
  thumbnailUrl: string;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  stockStatus?: StockStatus;
  isAvailable: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isRecommended: boolean;
  isSeasonal: boolean;
  deliveryEligible: boolean;
  pickupEligible: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  displayOrder: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface UpdatePricingDto {
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  taxCategory?: string;
}

export interface UpdateInventoryDto {
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  stockStatus?: StockStatus;
}

export interface UpdateAvailabilityDto {
  isAvailable: boolean;
  deliveryEligible: boolean;
  pickupEligible: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
}
