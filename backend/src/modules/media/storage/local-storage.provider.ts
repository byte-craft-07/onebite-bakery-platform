import fs from "node:fs/promises";
import path from "node:path";

import type {
  IStorageProvider,
  SaveFileResult,
} from "./storage-provider.interface.js";

export class LocalStorageProvider implements IStorageProvider {
  public readonly providerName = "LOCAL";

  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  public constructor(uploadsDir?: string, baseUrl?: string) {
    this.uploadsDir =
      uploadsDir ?? path.join(process.cwd(), "public", "uploads");
    this.baseUrl = baseUrl ?? process.env.PUBLIC_MEDIA_BASE_URL ?? "/uploads";
  }

  public async save(
    fileBuffer: Buffer,
    filename: string,
    _mimeType: string,
    folder: string,
  ): Promise<SaveFileResult> {
    const targetDir = path.join(this.uploadsDir, folder);
    await fs.mkdir(targetDir, { recursive: true });

    const fullFilePath = path.join(targetDir, filename);
    await fs.writeFile(fullFilePath, fileBuffer);

    const relativeStoragePath = `${folder}/${filename}`;
    const publicUrl = this.generatePublicUrl(relativeStoragePath);

    return {
      storagePath: relativeStoragePath,
      publicUrl,
    };
  }

  public async delete(storagePath: string): Promise<boolean> {
    try {
      const fullFilePath = path.join(this.uploadsDir, storagePath);
      await fs.unlink(fullFilePath);
      return true;
    } catch (_error) {
      return false;
    }
  }

  public generatePublicUrl(storagePath: string): string {
    const normalizedPath = storagePath.startsWith("/")
      ? storagePath.slice(1)
      : storagePath;
    const base = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;

    return `${base}/${normalizedPath}`;
  }
}
