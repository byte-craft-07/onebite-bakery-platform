export const COLLECTION_NAMES = {
  USERS: "users",
  ADDRESSES: "addresses",
  REFRESH_TOKENS: "refreshTokens",
  CATEGORIES: "categories",
  OCCASIONS: "occasions",
  PRODUCTS: "products",
  MEDIA: "media",
  CARTS: "carts",
  ORDERS: "orders",
  SETTINGS: "settings",
  FAVORITES: "favorites",
  VILLAGES: "villages",
  COUPONS: "coupons",
  BRANCHES: "branches",
  BRANCH_PRODUCTS: "branch_products",
  CUSTOM_CAKE_OPTIONS: "custom_cake_options",
  CUSTOM_CAKE_INQUIRIES: "custom_cake_inquiries",
  COMBOS: "combos",
  BANNERS: "banners",
  PAYMENTS: "payments",
  REVIEWS: "reviews",
  DECORATIONS: "decorations",
} as const;

export type CollectionName =
  (typeof COLLECTION_NAMES)[keyof typeof COLLECTION_NAMES];
