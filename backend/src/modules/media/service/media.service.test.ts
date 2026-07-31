import { Types, type HydratedDocument } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import { type Media } from "../model/index.js";
import type { MediaRepository } from "../repository/index.js";
import type { ExpressUploadedFile } from "./media.service.js";
import { MediaService } from "./media.service.js";
import type { IStorageProvider } from "../storage/index.js";

const adminId = new Types.ObjectId().toString();
const customerId = new Types.ObjectId().toString();
const otherCustomerId = new Types.ObjectId().toString();
const mediaId = new Types.ObjectId();

const createMockFile = (overrides: Partial<ExpressUploadedFile> = {}): ExpressUploadedFile => ({
  fieldname: "file",
  originalname: "truffle-cake.webp",
  encoding: "7bit",
  mimetype: "image/webp",
  size: 1024 * 1024, // 1 MB
  buffer: Buffer.from("mock-image-binary-data"),
  ...overrides,
});

const createMockMediaDocument = (overrides: Partial<Media> = {}): HydratedDocument<Media> => {
  const media = {
    _id: mediaId,
    filename: "product_20260731_mock123.webp",
    originalName: "truffle-cake.webp",
    mimeType: "image/webp",
    extension: ".webp",
    size: 1024 * 1024,
    storageProvider: "LOCAL",
    storagePath: "products/product_20260731_mock123.webp",
    publicUrl: "/uploads/products/product_20260731_mock123.webp",
    uploadedBy: new Types.ObjectId(adminId),
    entityType: "PRODUCT",
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return media as unknown as HydratedDocument<Media>;
};

const createService = (
  mediaRepoOverrides: Partial<Record<keyof MediaRepository, unknown>> = {},
  storageOverrides: Partial<IStorageProvider> = {},
) => {
  const mediaRepository = {
    create: vi
      .fn()
      .mockImplementation((data: Partial<Media>) =>
        Promise.resolve(createMockMediaDocument(data)),
      ),
    findById: vi.fn().mockResolvedValue(createMockMediaDocument()),
    findByEntity: vi.fn().mockResolvedValue([createMockMediaDocument()]),
    deleteMedia: vi.fn().mockResolvedValue(createMockMediaDocument()),
    ...mediaRepoOverrides,
  } as unknown as MediaRepository;

  const storageProvider: IStorageProvider = {
    providerName: "LOCAL",
    save: vi.fn().mockResolvedValue({
      storagePath: "products/product_20260731_mock123.webp",
      publicUrl: "/uploads/products/product_20260731_mock123.webp",
    }),
    delete: vi.fn().mockResolvedValue(true),
    generatePublicUrl: vi
      .fn()
      .mockImplementation((p) => `/uploads/${p}`),
    ...storageOverrides,
  };

  return {
    service: new MediaService(mediaRepository, storageProvider),
    mediaRepository,
    storageProvider,
  };
};

describe("MediaService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows admin to upload product image, saving file to storage and persisting metadata", async () => {
    const { service, mediaRepository, storageProvider } = createService();
    const mockFile = createMockFile();

    const result = await service.uploadMedia(
      mockFile,
      { entityType: "PRODUCT", entityId: "prod_123" },
      adminId,
      "admin",
    );

    expect(result.entityType).toBe("PRODUCT");
    expect(result.publicUrl).toBe("/uploads/products/product_20260731_mock123.webp");
    expect(storageProvider.save).toHaveBeenCalledOnce();
    expect(mediaRepository.create).toHaveBeenCalledOnce();
  });

  it("allows customer to upload custom cake reference image", async () => {
    const { service, storageProvider } = createService();
    const mockFile = createMockFile({ originalname: "my-cake-design.png", mimetype: "image/png" });

    const result = await service.uploadMedia(
      mockFile,
      { entityType: "CUSTOM_CAKE_REFERENCE" },
      customerId,
      "customer",
    );

    expect(result).toBeDefined();
    expect(storageProvider.save).toHaveBeenCalledOnce();
  });

  it("prevents customer from uploading product business media", async () => {
    const { service } = createService();
    const mockFile = createMockFile();

    await expect(
      service.uploadMedia(
        mockFile,
        { entityType: "PRODUCT" },
        customerId,
        "customer",
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects unsupported file mime type (e.g. image/gif)", async () => {
    const { service } = createService();
    const mockFile = createMockFile({ mimetype: "image/gif" });

    await expect(
      service.uploadMedia(
        mockFile,
        { entityType: "PRODUCT" },
        adminId,
        "admin",
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects oversized uploads exceeding entity limit (e.g. > 5MB for PRODUCT)", async () => {
    const { service } = createService();
    const oversizedFile = createMockFile({ size: 6 * 1024 * 1024 });

    await expect(
      service.uploadMedia(
        oversizedFile,
        { entityType: "PRODUCT" },
        adminId,
        "admin",
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("deletes physical file and database metadata when authorized", async () => {
    const { service, mediaRepository, storageProvider } = createService();

    const result = await service.deleteMedia(mediaId.toString(), adminId, "admin");

    expect(result.success).toBe(true);
    expect(storageProvider.delete).toHaveBeenCalledWith("products/product_20260731_mock123.webp");
    expect(mediaRepository.deleteMedia).toHaveBeenCalledWith(mediaId);
  });

  it("prevents unauthorized customer from deleting another user's uploaded media", async () => {
    const { service } = createService({
      findById: vi.fn().mockResolvedValue(
        createMockMediaDocument({ uploadedBy: new Types.ObjectId(otherCustomerId) }),
      ),
    });

    await expect(
      service.deleteMedia(mediaId.toString(), customerId, "customer"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("replaces existing media by removing old storage file and writing new file", async () => {
    const mockMediaDoc = createMockMediaDocument();
    const { service, storageProvider } = createService({
      findById: vi.fn().mockResolvedValue(mockMediaDoc),
    });

    const newFile = createMockFile({ originalname: "updated-cake.png", mimetype: "image/png" });

    const updated = await service.replaceMedia(
      mediaId.toString(),
      newFile,
      {},
      adminId,
      "admin",
    );

    expect(storageProvider.delete).toHaveBeenCalledWith("products/product_20260731_mock123.webp");
    expect(storageProvider.save).toHaveBeenCalledOnce();
    expect(updated).toBeDefined();
  });
});
