import type { CustomCakeConfig } from "../model/index.js";

export interface AddCartItemDto {
  productId: string;
  quantity: number;
  customization?: CustomCakeConfig;
  customCakeConfig?: CustomCakeConfig;
  selectedVariant?: Record<string, unknown>;
  notes?: string;
  sessionId?: string;
}

export interface UpdateCartItemDto {
  quantity?: number;
  notes?: string;
  sessionId?: string;
}

export interface MergeCartDto {
  sessionId: string;
}
