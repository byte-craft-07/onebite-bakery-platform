export interface MediaResponse {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  storageProvider: string;
  uploadedBy?: string;
  tags: string[];
  altText?: string;
  createdAt: Date;
  updatedAt: Date;
}
