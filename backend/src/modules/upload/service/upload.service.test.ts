import { Types, type HydratedDocument } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import type { Media } from "../model/index.js";
import type { StorageProvider, StorageUploadResult } from "../providers/index.js";
import type { MediaRepository } from "../repository/index.js";
import { UploadService } from "./upload.service.js";

const context: RequestContext = {
  userId: new Types.ObjectId().toString(),
  userRole: "admin",
  requestId: "upload-test",
};

const createMediaDocument = (
  overrides: Partial<Media> = {},
): HydratedDocument<Media> => {
  const now = new Date();
  const media: Media = {
    _id: new Types.ObjectId(),
    originalName: "cake-hero.png",
    fileName: "1720000000000-a1b2c3d4e5f67890.png",
    mimeType: "image/png",
    extension: "png",
    size: 1024,
    url: "/uploads/1720000000000-a1b2c3d4e5f67890.png",
    storageProvider: "LOCAL",
    uploadedBy: new Types.ObjectId(context.userId),
    tags: ["bakery", "cake"],
    altText: "Delicious cake hero image",
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  return media as HydratedDocument<Media>;
};

const createService = (
  repositoryOverrides: Partial<Record<keyof MediaRepository, unknown>> = {},
  storageOverrides: Partial<Record<keyof StorageProvider, unknown>> = {},
) => {
  const mediaRepository = {
    create: vi.fn().mockImplementation((data: Partial<Media>) =>
      Promise.resolve(createMediaDocument(data)),
    ),
    findActiveById: vi.fn().mockResolvedValue(createMediaDocument()),
    findByFileName: vi.fn().mockResolvedValue(createMediaDocument()),
    softDelete: vi.fn().mockResolvedValue(createMediaDocument({ isDeleted: true })),
    findPaginatedMedia: vi.fn().mockResolvedValue({
      items: [createMediaDocument()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    ...repositoryOverrides,
  } as unknown as MediaRepository;

  const storageProvider = {
    providerName: "LOCAL",
    upload: vi.fn().mockImplementation((file) =>
      Promise.resolve({
        url: `/uploads/1720000000000-test.${file.extension}`,
        fileName: `1720000000000-test.${file.extension}`,
        key: `1720000000000-test.${file.extension}`,
        size: file.size,
        mimeType: file.mimeType,
        extension: file.extension,
      } as StorageUploadResult),
    ),
    delete: vi.fn().mockResolvedValue(undefined),
    getUrl: vi.fn().mockImplementation((key) => Promise.resolve(`/uploads/${key}`)),
    ...storageOverrides,
  } as unknown as StorageProvider;

  return {
    service: new UploadService(mediaRepository, storageProvider),
    mediaRepository,
    storageProvider,
  };
};

const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: "file",
  originalname: "chocolate-cake.png",
  encoding: "7bit",
  mimetype: "image/png",
  buffer: Buffer.from("fake-image-bytes"),
  size: 1024,
  destination: "",
  filename: "",
  path: "",
  stream: null as unknown as Express.Multer.File["stream"],
  ...overrides,
});

describe("UploadService", () => {
  it("uploads a valid media file successfully", async () => {
    const { service, mediaRepository, storageProvider } = createService();

    const media = await service.uploadMedia(
      createMockFile(),
      { altText: "Delicious chocolate cake", tags: ["chocolate", "cake"] },
      context,
    );

    expect(media.originalName).toBe("chocolate-cake.png");
    expect(media.extension).toBe("png");
    expect(storageProvider.upload).toHaveBeenCalledOnce();
    expect(mediaRepository.create).toHaveBeenCalledOnce();
  });

  it("rejects upload when file is missing", async () => {
    const { service } = createService();

    await expect(
      service.uploadMedia(undefined, {}, context),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects upload with forbidden extension (.exe)", async () => {
    const { service } = createService();
    const maliciousFile = createMockFile({
      originalname: "malicious-script.exe",
      mimetype: "image/png",
    });

    await expect(
      service.uploadMedia(maliciousFile, {}, context),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects upload with invalid MIME type", async () => {
    const { service } = createService();
    const invalidMimeFile = createMockFile({
      originalname: "test.png",
      mimetype: "application/x-msdownload",
    });

    await expect(
      service.uploadMedia(invalidMimeFile, {}, context),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects upload when file size exceeds maximum limit", async () => {
    const { service } = createService();
    const oversizedFile = createMockFile({
      size: 10 * 1024 * 1024, // 10MB > 5MB limit
    });

    await expect(
      service.uploadMedia(oversizedFile, {}, context),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("retrieves media details by id", async () => {
    const { service, mediaRepository } = createService();
    const id = new Types.ObjectId().toString();

    const media = await service.getMedia(id);

    expect(media.originalName).toBe("cake-hero.png");
    expect(mediaRepository.findActiveById).toHaveBeenCalledOnce();
  });

  it("throws 404 when media is not found", async () => {
    const { service } = createService({
      findActiveById: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.getMedia(new Types.ObjectId().toString()),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("deletes media and removes file from storage provider", async () => {
    const { service, mediaRepository, storageProvider } = createService();
    const id = new Types.ObjectId().toString();

    await service.deleteMedia(id, context);

    expect(storageProvider.delete).toHaveBeenCalledOnce();
    expect(mediaRepository.softDelete).toHaveBeenCalledOnce();
  });

  it("lists paginated media records", async () => {
    const { service, mediaRepository } = createService();

    const result = await service.listMedia({ page: 1, limit: 10 });

    expect(result.media).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(mediaRepository.findPaginatedMedia).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });
});
