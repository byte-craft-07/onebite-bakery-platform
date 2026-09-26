import { Readable } from "node:stream";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import { env } from "../../../config/env.js";
import { logger } from "../../../shared/utils/logger.js";
import type {
  IStorageProvider,
  SaveFileResult,
} from "./storage-provider.interface.js";

export class CloudinaryStorageProvider implements IStorageProvider {
  public readonly providerName = "CLOUDINARY";

  public constructor() {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
  }

  public async save(
    fileBuffer: Buffer,
    filename: string,
    _mimeType: string,
    folder: string,
  ): Promise<SaveFileResult> {
    return new Promise((resolve, reject) => {
      const publicId = filename.replace(/\.[^/.]+$/, "");
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `onebite-bakery/${folder}`,
          public_id: publicId,
          resource_type: "auto",
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            logger.error({ error }, "Cloudinary upload failed in media module");
            return reject(error || new Error("Cloudinary upload failed"));
          }

          resolve({
            storagePath: result.public_id,
            publicUrl: result.secure_url,
          });
        },
      );

      Readable.from(fileBuffer).pipe(uploadStream);
    });
  }

  public async delete(storagePath: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(storagePath);
      return true;
    } catch (error) {
      logger.error({ error, storagePath }, "Failed to delete image from Cloudinary");
      return false;
    }
  }

  public generatePublicUrl(storagePath: string): string {
    return cloudinary.url(storagePath, { secure: true });
  }
}
