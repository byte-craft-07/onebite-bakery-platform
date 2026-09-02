import path from "node:path";
import sharp from "sharp";
import type { StorageFile } from "../providers/index.js";

export interface ImageOptimizationHook {
  optimize(file: StorageFile): Promise<StorageFile>;
  generateThumbnail(file: StorageFile): Promise<StorageFile | null>;
}

export class DefaultImageOptimizationHook implements ImageOptimizationHook {
  /**
   * Automatically compresses and converts uploaded raster images (JPEG, PNG, etc.)
   * to high-efficiency WebP format while preserving vector SVG files.
   */
  public async optimize(file: StorageFile): Promise<StorageFile> {
    const ext = file.extension.toLowerCase();

    // 1. Preserve SVGs without rasterizing
    if (ext === "svg" || file.mimeType === "image/svg+xml") {
      return file;
    }

    try {
      // 2. Process image with Sharp
      const image = sharp(file.buffer, { failOn: "none" });
      const metadata = await image.metadata();

      // Resize if dimensions are overly large (max width 2048px, max height 2048px)
      let pipeline = image;
      if (
        (metadata.width && metadata.width > 2048) ||
        (metadata.height && metadata.height > 2048)
      ) {
        pipeline = pipeline.resize({
          width: 2048,
          height: 2048,
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert to WebP with balanced 82% quality (lossless-equivalent visual fidelity, 70-85% size reduction)
      const optimizedBuffer = await pipeline
        .webp({
          quality: 82,
          effort: 4,
          smartSubsample: true,
        })
        .toBuffer();

      const baseName = path.parse(file.originalName).name;

      return {
        originalName: `${baseName}.webp`,
        buffer: optimizedBuffer,
        mimeType: "image/webp",
        size: optimizedBuffer.length,
        extension: "webp",
      };
    } catch (_error) {
      // If conversion fails (e.g. animated GIF or corrupted payload), safely fallback to original file
      return file;
    }
  }

  /**
   * Generates a 300x300 crisp thumbnail WebP for product card previews
   */
  public async generateThumbnail(file: StorageFile): Promise<StorageFile | null> {
    const ext = file.extension.toLowerCase();
    if (ext === "svg" || file.mimeType === "image/svg+xml") {
      return null;
    }

    try {
      const thumbnailBuffer = await sharp(file.buffer, { failOn: "none" })
        .resize(300, 300, { fit: "cover", position: "center" })
        .webp({ quality: 80 })
        .toBuffer();

      const baseName = path.parse(file.originalName).name;

      return {
        originalName: `${baseName}_thumb.webp`,
        buffer: thumbnailBuffer,
        mimeType: "image/webp",
        size: thumbnailBuffer.length,
        extension: "webp",
      };
    } catch (_error) {
      return null;
    }
  }
}
