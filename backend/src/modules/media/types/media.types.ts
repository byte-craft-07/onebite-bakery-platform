import type {
  MediaEntityType,
  StorageProviderType,
} from "../constants/index.js";

export interface MediaResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
  storageProvider: StorageProviderType;
  publicUrl: string;
  url: string;
  uploadedBy: string;
  entityType: MediaEntityType;
  entityId?: string;
  createdAt: Date;
  updatedAt: Date;
}

