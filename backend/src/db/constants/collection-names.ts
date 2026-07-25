export const COLLECTION_NAMES = {
  USERS: "users",
  ADDRESSES: "addresses",
  OTPS: "otps",
  REFRESH_TOKENS: "refreshTokens",
  SETTINGS: "settings",
} as const;

export type CollectionName =
  (typeof COLLECTION_NAMES)[keyof typeof COLLECTION_NAMES];

