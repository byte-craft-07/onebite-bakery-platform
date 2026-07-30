import type { ProductType } from "../constants/index.js";

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  categoryId: string;
  occasionIds: string[];
  productType: ProductType;
  price: number;
  compareAtPrice?: number;
  imageUrls: string[];
  thumbnailUrl: string;
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
