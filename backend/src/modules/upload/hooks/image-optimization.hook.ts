import type { StorageFile } from "../providers/index.js";

export interface ImageOptimizationHook {
  optimize(file: StorageFile): Promise<StorageFile>;
  generateThumbnail(file: StorageFile): Promise<StorageFile | null>;
}

export class DefaultImageOptimizationHook implements ImageOptimizationHook {
  public async optimize(file: StorageFile): Promise<StorageFile> {
    // Hook prepared for future optimization (e.g. sharp image compression).
    return file;
  }

  public async generateThumbnail(_file: StorageFile): Promise<StorageFile | null> {
    // Hook prepared for future thumbnail generation.
    return null;
  }
}
