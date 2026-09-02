import crypto from "node:crypto";
import path from "node:path";
import type { HydratedDocument } from "mongoose";
import sharp from "sharp";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MEDIA_SIZE_LIMITS,
  type AllowedMediaMimeType,
  type MediaEntityType,
} from "../constants/index.js";
import type { ReplaceMediaDto, UploadMediaDto } from "../dto/index.js";
import { type Media } from "../model/index.js";
import type { MediaRepository } from "../repository/index.js";
import { LocalStorageProvider, type IStorageProvider } from "../storage/index.js";
import type { MediaResponse } from "../types/index.js";

export interface ExpressUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class MediaService {
  private readonly storageProvider: IStorageProvider;

  public constructor(
    private readonly mediaRepository: MediaRepository,
    storageProvider?: IStorageProvider,
  ) {
    this.storageProvider = storageProvider ?? new LocalStorageProvider();
  }

  public async uploadMedia(
    file: ExpressUploadedFile,
    dto: UploadMediaDto,
    userId: string,
    userRole: string,
  ): Promise<MediaResponse> {
    this.validateUploadAuthorization(dto.entityType, userRole);
    this.validateFileFormatAndSize(file, dto.entityType);

    let ext = path.extname(file.originalname).toLowerCase();
    let bufferToSave = file.buffer;
    let mimeTypeToSave = file.mimetype;
    let sizeToSave = file.size;

    // Automatically convert non-SVG images to optimized WebP
    if (ext !== ".svg" && file.mimetype !== "image/svg+xml") {
      try {
        const optimized = await sharp(file.buffer, { failOn: "none" })
          .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toBuffer();

        bufferToSave = optimized;
        mimeTypeToSave = "image/webp";
        sizeToSave = optimized.length;
        ext = ".webp";
      } catch (_err) {
        // Fallback to original buffer if sharp fails on unusual formats
      }
    }

    const folder = this.getFolderForEntityType(dto.entityType);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const filename = `${dto.entityType.toLowerCase()}_${datePrefix}_${randomSuffix}${ext}`;

    const saveResult = await this.storageProvider.save(
      bufferToSave,
      filename,
      mimeTypeToSave,
      folder,
    );

    const userObjId = toObjectId(userId);

    const mediaDoc = await this.mediaRepository.create({
      filename,
      originalName: file.originalname,
      mimeType: mimeTypeToSave,
      extension: ext,
      size: sizeToSave,
      storageProvider: "LOCAL",
      storagePath: saveResult.storagePath,
      publicUrl: saveResult.publicUrl,
      uploadedBy: userObjId,
      entityType: dto.entityType,
      ...(dto.entityId ? { entityId: dto.entityId } : {}),
    });

    return this.toResponse(mediaDoc);
  }

  public async getMediaById(id: string): Promise<MediaResponse> {
    const mediaObjId = toObjectId(id);
    const mediaDoc = await this.mediaRepository.findById(mediaObjId);

    if (!mediaDoc) {
      throw new AppError(
        "Media record not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.MEDIA_NOT_FOUND,
      );
    }

    return this.toResponse(mediaDoc);
  }

  public async deleteMedia(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<{ success: boolean; message: string }> {
    const mediaObjId = toObjectId(id);
    const mediaDoc = await this.mediaRepository.findById(mediaObjId);

    if (!mediaDoc) {
      throw new AppError(
        "Media record not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.MEDIA_NOT_FOUND,
      );
    }

    if (userRole !== "admin" && mediaDoc.uploadedBy.toString() !== userId) {
      throw new AppError(
        "You are not authorized to delete this media.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    await this.storageProvider.delete(mediaDoc.storagePath);
    await this.mediaRepository.deleteMedia(mediaObjId);

    return {
      success: true,
      message: "Media deleted successfully.",
    };
  }

  public async replaceMedia(
    id: string,
    file: ExpressUploadedFile,
    dto: ReplaceMediaDto,
    userId: string,
    userRole: string,
  ): Promise<MediaResponse> {
    const mediaObjId = toObjectId(id);
    const mediaDoc = await this.mediaRepository.findById(mediaObjId);

    if (!mediaDoc) {
      throw new AppError(
        "Media record not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.MEDIA_NOT_FOUND,
      );
    }

    if (userRole !== "admin" && mediaDoc.uploadedBy.toString() !== userId) {
      throw new AppError(
        "You are not authorized to replace this media.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    const entityType = dto.entityType ?? mediaDoc.entityType;
    this.validateFileFormatAndSize(file, entityType);

    // Delete existing physical file
    await this.storageProvider.delete(mediaDoc.storagePath);

    const ext = path.extname(file.originalname).toLowerCase();
    const folder = this.getFolderForEntityType(entityType);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const filename = `${entityType.toLowerCase()}_${datePrefix}_${randomSuffix}${ext}`;

    const saveResult = await this.storageProvider.save(
      file.buffer,
      filename,
      file.mimetype,
      folder,
    );

    mediaDoc.filename = filename;
    mediaDoc.originalName = file.originalname;
    mediaDoc.mimeType = file.mimetype;
    mediaDoc.extension = ext;
    mediaDoc.size = file.size;
    mediaDoc.storagePath = saveResult.storagePath;
    mediaDoc.publicUrl = saveResult.publicUrl;
    mediaDoc.entityType = entityType;
    if (dto.entityId !== undefined) mediaDoc.entityId = dto.entityId;

    await mediaDoc.save();

    return this.toResponse(mediaDoc);
  }

  private validateUploadAuthorization(
    entityType: MediaEntityType,
    userRole: string,
  ): void {
    if (userRole === "admin") {
      return; // Admin can upload all entity types
    }

    if (userRole === "customer" && entityType === "CUSTOM_CAKE_REFERENCE") {
      return; // Customers can upload custom cake reference images
    }

    throw new AppError(
      `Customers are not authorized to upload media for entity type '${entityType}'. Only admins can upload business assets.`,
      HTTP_STATUS.FORBIDDEN,
      [],
      true,
      APP_ERROR_CODES.AUTHORIZATION_FAILED,
    );
  }

  private validateFileFormatAndSize(
    file: ExpressUploadedFile,
    entityType: MediaEntityType,
  ): void {
    if (!file || !file.buffer) {
      throw new AppError(
        "Upload failed. File payload is missing.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.MEDIA_FILE_REQUIRED,
      );
    }

    const mime = file.mimetype.toLowerCase() as AllowedMediaMimeType;
    if (!ALLOWED_MEDIA_MIME_TYPES.includes(mime)) {
      throw new AppError(
        `Unsupported file type '${file.mimetype}'. Allowed formats: JPG, JPEG, PNG, WEBP.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.MEDIA_INVALID_MIME,
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      throw new AppError(
        `Unsupported file extension '${ext}'. Allowed extensions: .jpg, .jpeg, .png, .webp.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.MEDIA_INVALID_EXTENSION,
      );
    }

    const maxLimit = MEDIA_SIZE_LIMITS[entityType];
    if (file.size > maxLimit) {
      const maxMb = (maxLimit / (1024 * 1024)).toFixed(1);
      throw new AppError(
        `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of ${maxMb} MB for ${entityType}.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.MEDIA_FILE_TOO_LARGE,
      );
    }
  }

  private getFolderForEntityType(entityType: MediaEntityType): string {
    switch (entityType) {
      case "PRODUCT":
        return "products";
      case "CATEGORY":
        return "categories";
      case "OCCASION":
        return "occasions";
      case "COMBO":
        return "products/combo";
      case "DECORATION":
        return "products/decoration";
      case "LOGO":
        return "logo";
      case "BANNER":
        return "banners";
      case "CUSTOM_CAKE_REFERENCE":
        return "custom-cakes";
      default:
        return "uploads";
    }
  }

  private toResponse(media: HydratedDocument<Media>): MediaResponse {
    return {
      id: media._id.toString(),
      filename: media.filename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      extension: media.extension,
      size: media.size,
      ...(media.width ? { width: media.width } : {}),
      ...(media.height ? { height: media.height } : {}),
      storageProvider: media.storageProvider,
      publicUrl: media.publicUrl,
      uploadedBy: media.uploadedBy.toString(),
      entityType: media.entityType,
      ...(media.entityId ? { entityId: media.entityId } : {}),
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
