import { Readable } from "node:stream";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import { env } from "../../../config/env.js";
import { logger } from "../../../shared/utils/logger.js";
import type {
  StorageFile,
  StorageProvider,
  StorageUploadResult,
} from "./storage-provider.interface.js";

export class CloudinaryStorageProvider implements StorageProvider {
  public readonly providerName = "CLOUDINARY";

  public constructor() {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
  }

  public async upload(file: StorageFile): Promise<StorageUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "onebite-bakery",
          resource_type: "auto",
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            logger.error({ error }, "Cloudinary upload failed");
            return reject(error || new Error("Cloudinary upload failed"));
          }

          resolve({
            url: result.secure_url,
            fileName: result.public_id,
            key: result.public_id,
            size: result.bytes || file.size,
            mimeType: file.mimeType,
            extension: file.extension,
          });
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  public async delete(keyOrFileName: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(keyOrFileName);
    } catch (error) {
      logger.error({ error, keyOrFileName }, "Failed to delete image from Cloudinary");
    }
  }

  public async getUrl(keyOrFileName: string): Promise<string> {
    return cloudinary.url(keyOrFileName, { secure: true });
  }
}
