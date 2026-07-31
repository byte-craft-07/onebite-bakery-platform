export const MEDIA_ENTITY_TYPES = [
  "PRODUCT",
  "CATEGORY",
  "OCCASION",
  "COMBO",
  "DECORATION",
  "LOGO",
  "BANNER",
  "CUSTOM_CAKE_REFERENCE",
] as const;

export type MediaEntityType = (typeof MEDIA_ENTITY_TYPES)[number];

export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

export const ALLOWED_MEDIA_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export const MEDIA_SIZE_LIMITS: Record<MediaEntityType, number> = {
  PRODUCT: 5 * 1024 * 1024,
  CATEGORY: 5 * 1024 * 1024,
  OCCASION: 5 * 1024 * 1024,
  COMBO: 5 * 1024 * 1024,
  DECORATION: 5 * 1024 * 1024,
  CUSTOM_CAKE_REFERENCE: 10 * 1024 * 1024,
  LOGO: 2 * 1024 * 1024,
  BANNER: 8 * 1024 * 1024,
};

export const STORAGE_PROVIDERS = ["LOCAL", "S3", "CLOUDINARY"] as const;

export type StorageProviderType = (typeof STORAGE_PROVIDERS)[number];
