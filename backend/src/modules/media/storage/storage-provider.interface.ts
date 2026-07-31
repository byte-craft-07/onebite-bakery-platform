export interface SaveFileResult {
  storagePath: string;
  publicUrl: string;
}

export interface IStorageProvider {
  readonly providerName: string;
  save(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string,
  ): Promise<SaveFileResult>;
  delete(storagePath: string): Promise<boolean>;
  generatePublicUrl(storagePath: string): string;
}
