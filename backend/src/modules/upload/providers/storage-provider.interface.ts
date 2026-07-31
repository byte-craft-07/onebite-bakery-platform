export interface StorageFile {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  extension: string;
}

export interface StorageUploadResult {
  url: string;
  fileName: string;
  key: string;
  size: number;
  mimeType: string;
  extension: string;
}

export interface StorageProvider {
  readonly providerName: string;
  upload(file: StorageFile): Promise<StorageUploadResult>;
  delete(keyOrFileName: string): Promise<void>;
  getUrl(keyOrFileName: string): Promise<string>;
}
