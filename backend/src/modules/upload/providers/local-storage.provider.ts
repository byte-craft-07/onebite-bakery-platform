import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  StorageFile,
  StorageProvider,
  StorageUploadResult,
} from "./storage-provider.interface.js";

export class LocalStorageProvider implements StorageProvider {
  public readonly providerName = "LOCAL";
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  public constructor(uploadDir?: string, baseUrl?: string) {
    this.uploadDir = uploadDir ?? path.join(process.cwd(), "public", "uploads");
    this.baseUrl = baseUrl ?? "/uploads";
  }

  public async upload(file: StorageFile): Promise<StorageUploadResult> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const safeExtension = file.extension.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const uniqueToken = crypto.randomBytes(8).toString("hex");
    const fileName = `${Date.now()}-${uniqueToken}.${safeExtension}`;
    const destinationPath = path.join(this.uploadDir, fileName);

    await fs.writeFile(destinationPath, file.buffer);

    const url = `${this.baseUrl}/${fileName}`;

    return {
      url,
      fileName,
      key: fileName,
      size: file.size,
      mimeType: file.mimeType,
      extension: safeExtension,
    };
  }

  public async delete(keyOrFileName: string): Promise<void> {
    const safeFileName = path.basename(keyOrFileName);
    const filePath = path.join(this.uploadDir, safeFileName);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  public async getUrl(keyOrFileName: string): Promise<string> {
    const safeFileName = path.basename(keyOrFileName);
    return `${this.baseUrl}/${safeFileName}`;
  }
}
