export const PRODUCT_RESPONSE_MESSAGES = {
  CREATED: "Product created successfully.",
  UPDATED: "Product updated successfully.",
  DELETED: "Product deleted successfully.",
  RESTORED: "Product restored successfully.",
  FETCHED: "Product fetched successfully.",
  LISTED: "Products fetched successfully.",
  PRICING_UPDATED: "Product pricing updated successfully.",
  INVENTORY_UPDATED: "Product inventory updated successfully.",
  AVAILABILITY_UPDATED: "Product availability updated successfully.",
} as const;

export const PRODUCT_ERROR_MESSAGES = {
  NOT_FOUND: "Product not found.",
  SLUG_CONFLICT: "Product slug already exists.",
  INVALID_CATEGORY: "Category is invalid.",
  INVALID_OCCASION: "One or more occasions are invalid.",
  INVALID_COMBO: "Combo items are invalid.",
} as const;
