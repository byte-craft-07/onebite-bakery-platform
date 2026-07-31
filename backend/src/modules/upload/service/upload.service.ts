import path from "node:path";
import type { HydratedDocument, Types } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import type { ListMediaFilterDto, UploadMediaBodyDto } from "../dto/index.js";
import {
  DefaultImageOptimizationHook,
  type ImageOptimizationHook,
} from "../hooks/index.js";
import type { Media } from "../model/index.js";
import { LocalStorageProvider, type StorageFile, type StorageProvider } from "../providers/index.js";
import type { MediaRepository } from "../repository/index.js";
import type { MediaResponse } from "../types/index.js";

export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "svg"] as const;
export const FORBIDDEN_EXTENSIONS = [
  "exe",
  "js",
  "php",
  "html",
  "htm",
  "phtml",
  "bat",
  "sh",
  "cmd",
  "vbs",
  "dll",
  "cgi",
] as const;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
] as const;

export const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class UploadService {
  private readonly storageProvider: StorageProvider;
  private readonly optimizationHook: ImageOptimizationHook;
  private readonly maxSizeBytes: number;

  public constructor(
    private readonly mediaRepository: MediaRepository,
    storageProvider?: StorageProvider,
    optimizationHook?: ImageOptimizationHook,
    maxSizeBytes?: number,
  ) {
    this.storageProvider = storageProvider ?? new LocalStorageProvider();
    this.optimizationHook =
      optimizationHook ?? new DefaultImageOptimizationHook();
    this.maxSizeBytes = maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
  }

  public async uploadMedia(
    rawFile: Express.Multer.File | undefined,
    body: UploadMediaBodyDto,
    context: RequestContext,
  ): Promise<MediaResponse> {
    if (!rawFile || !rawFile.buffer) {
      throw new AppError(
        "File is required for upload.",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.MEDIA_FILE_REQUIRED,
      );
    }

    const originalName = path.basename(rawFile.originalname.trim());
    const rawExt = path.extname(originalName).replace(".", "").toLowerCase();

    this.validateExtension(rawExt);
    this.validateMimeType(rawFile.mimetype);
    this.validateFileSize(rawFile.size);

    let storageFile: StorageFile = {
      originalName,
      buffer: rawFile.buffer,
      mimeType: rawFile.mimetype,
      size: rawFile.size,
      extension: rawExt,
    };

    // Optimization hook invocation
    storageFile = await this.optimizationHook.optimize(storageFile);

    const uploadResult = await this.storageProvider.upload(storageFile);

    const media = await this.mediaRepository.create({
      originalName,
      fileName: uploadResult.fileName,
      mimeType: uploadResult.mimeType,
      extension: uploadResult.extension,
      size: uploadResult.size,
      url: uploadResult.url,
      storageProvider: this.storageProvider.providerName,
      uploadedBy: context.userId ? toObjectId(context.userId) : undefined,
      tags: body.tags ?? [],
      altText: body.altText,
      isDeleted: false,
    });

    return this.toResponse(media);
  }

  public async getMedia(id: string): Promise<MediaResponse> {
    const mediaId = toObjectId(id);
    const media = await this.mediaRepository.findActiveById(mediaId);

    if (!media) {
      throw this.createNotFoundError();
    }

    return this.toResponse(media);
  }

  public async deleteMedia(
    id: string,
    context: RequestContext,
  ): Promise<MediaResponse> {
    const mediaId = toObjectId(id);
    const media = await this.mediaRepository.findActiveById(mediaId);

    if (!media) {
      throw this.createNotFoundError();
    }

    await this.storageProvider.delete(media.fileName);

    const deleted = await this.mediaRepository.softDelete(
      { _id: mediaId, isDeleted: false },
      context.userId ? toObjectId(context.userId) : undefined,
    );

    if (!deleted) {
      throw this.createNotFoundError();
    }

    return this.toResponse(deleted);
  }

  public async listMedia(query: ListMediaFilterDto): Promise<{
    media: MediaResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const result = await this.mediaRepository.findPaginatedMedia(query);

    return {
      media: result.items.map((item) => this.toResponse(item)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  public validateExtension(extension: string): void {
    const normalized = extension.toLowerCase().trim();

    if (
      (FORBIDDEN_EXTENSIONS as readonly string[]).includes(normalized) ||
      !(ALLOWED_EXTENSIONS as readonly string[]).includes(normalized)
    ) {
      throw new AppError(
        `File extension '.${normalized}' is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.MEDIA_INVALID_EXTENSION,
      );
    }
  }

  public validateMimeType(mimeType: string): void {
    const normalized = mimeType.toLowerCase().trim();

    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(normalized)) {
      throw new AppError(
        `MIME type '${mimeType}' is not allowed. Allowed MIME types: ${ALLOWED_MIME_TYPES.join(", ")}.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.MEDIA_INVALID_MIME,
      );
    }
  }

  public validateFileSize(size: number): void {
    if (size > this.maxSizeBytes) {
      throw new AppError(
        `File size exceeds maximum allowed limit of ${Math.round(this.maxSizeBytes / (1024 * 1024))} MB.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.MEDIA_FILE_TOO_LARGE,
      );
    }
  }

  private toResponse(media: HydratedDocument<Media>): MediaResponse {
    return {
      id: media._id.toString(),
      originalName: media.originalName,
      fileName: media.fileName,
      mimeType: media.mimeType,
      extension: media.extension,
      size: media.size,
      ...(media.width !== undefined ? { width: media.width } : {}),
      ...(media.height !== undefined ? { height: media.height } : {}),
      url: media.url,
      storageProvider: media.storageProvider,
      ...(media.uploadedBy ? { uploadedBy: media.uploadedBy.toString() } : {}),
      tags: media.tags,
      ...(media.altText ? { altText: media.altText } : {}),
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }

  private createNotFoundError(): AppError {
    return new AppError(
      "Media file not found.",
      HTTP_STATUS.NOT_FOUND,
      [],
      true,
      APP_ERROR_CODES.MEDIA_NOT_FOUND,
    );
  }
}
