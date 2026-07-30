import { Types, type HydratedDocument } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import type { Product } from "../model/index.js";
import type { ProductRepository } from "../repository/index.js";
import { ProductService } from "./product.service.js";

const context: RequestContext = {
  userId: new Types.ObjectId().toString(),
  userRole: "admin",
  requestId: "product-test",
};

const categoryId = new Types.ObjectId("507f1f77bcf86cd799439011");
const occasionId = new Types.ObjectId("507f1f77bcf86cd799439012");

const createProductDocument = (
  overrides: Partial<Product> = {},
): HydratedDocument<Product> => {
  const now = new Date();
  const product: Product = {
    _id: new Types.ObjectId(),
    name: "Chocolate Truffle Cake",
    slug: "chocolate-truffle-cake",
    shortDescription: "Rich chocolate cake.",
    description: "Rich chocolate truffle cake for celebrations.",
    categoryId,
    productType: "NORMAL",
    occasionIds: [occasionId],
    comboItems: [],
    price: 499,
    imageUrls: ["https://cdn.onebite.test/chocolate-truffle.webp"],
    thumbnailUrl: "https://cdn.onebite.test/chocolate-truffle-thumb.webp",
    deliveryEligible: true,
    pickupEligible: true,
    isActive: true,
    isFeatured: false,
    isTrending: false,
    isRecommended: false,
    isSeasonal: false,
    displayOrder: 1,
    seoTitle: "Chocolate Truffle Cake",
    seoDescription: "Order chocolate truffle cake from OneBite Bakery.",
    seoKeywords: ["chocolate", "cake"],
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  return product as HydratedDocument<Product>;
};

const createDto = () => ({
  name: "Chocolate Truffle Cake",
  description: "Rich chocolate truffle cake for celebrations.",
  shortDescription: "Rich chocolate cake.",
  categoryId: categoryId.toString(),
  occasionIds: [occasionId.toString()],
  productType: "NORMAL" as const,
  price: 499,
  imageUrls: ["https://cdn.onebite.test/chocolate-truffle.webp"],
  thumbnailUrl: "https://cdn.onebite.test/chocolate-truffle-thumb.webp",
  isActive: true,
  isFeatured: false,
  isTrending: false,
  isRecommended: false,
  isSeasonal: false,
  deliveryEligible: true,
  pickupEligible: true,
  displayOrder: 1,
  seoTitle: "Chocolate Truffle Cake",
  seoDescription: "Order chocolate truffle cake from OneBite Bakery.",
  seoKeywords: ["chocolate", "cake"],
});

const createService = (
  overrides: Partial<Record<keyof ProductRepository, unknown>> = {},
) => {
  const repository = {
    create: vi.fn().mockImplementation((data: Partial<Product>) =>
      Promise.resolve(createProductDocument(data)),
    ),
    findBySlug: vi.fn().mockResolvedValue(null),
    findActiveBySlug: vi.fn().mockResolvedValue(createProductDocument()),
    findPublicList: vi.fn().mockResolvedValue([createProductDocument()]),
    findAdminList: vi.fn().mockResolvedValue([createProductDocument()]),
    findByIdIncludingDeleted: vi.fn().mockResolvedValue(createProductDocument()),
    updateById: vi.fn().mockImplementation(
      (_id: Types.ObjectId, update: { $set?: Partial<Product> }) =>
        Promise.resolve(createProductDocument(update.$set ?? {})),
    ),
    softDelete: vi.fn().mockResolvedValue(createProductDocument({
      isDeleted: true,
    })),
    categoryExists: vi.fn().mockResolvedValue(true),
    findMissingOccasionIds: vi.fn().mockResolvedValue([]),
    findExistingProduct: vi.fn().mockResolvedValue(createProductDocument()),
    ...overrides,
  } as unknown as ProductRepository;

  return {
    service: new ProductService(repository),
    repository,
  };
};

describe("ProductService", () => {
  it("creates a product with a generated slug", async () => {
    const { service, repository } = createService();

    const product = await service.createProduct(createDto(), context);

    expect(product.slug).toBe("chocolate-truffle-cake");
    expect(repository.create).toHaveBeenCalledOnce();
  });

  it("rejects duplicate explicit slugs", async () => {
    const { service } = createService({
      findBySlug: vi.fn().mockResolvedValue(createProductDocument()),
    });

    await expect(
      service.createProduct(
        { ...createDto(), slug: "chocolate-truffle-cake" },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects invalid categories", async () => {
    const { service } = createService({
      categoryExists: vi.fn().mockResolvedValue(false),
    });

    await expect(service.createProduct(createDto(), context)).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("rejects invalid occasions", async () => {
    const { service } = createService({
      findMissingOccasionIds: vi.fn().mockResolvedValue([occasionId]),
    });

    await expect(service.createProduct(createDto(), context)).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("soft deletes a product", async () => {
    const product = createProductDocument();
    const { service, repository } = createService({
      findExistingProduct: vi.fn().mockResolvedValue(product),
    });

    await service.deleteProduct(product._id.toString(), context);

    expect(repository.softDelete).toHaveBeenCalledOnce();
  });

  it("restores a product", async () => {
    const deleted = createProductDocument({ isDeleted: true });
    const { service, repository } = createService({
      findByIdIncludingDeleted: vi.fn().mockResolvedValue(deleted),
    });

    await service.restoreProduct(deleted._id.toString(), context);

    expect(repository.updateById).toHaveBeenCalledOnce();
  });

  it("lists only public products from repository public query", async () => {
    const { service, repository } = createService();

    const products = await service.listPublicProducts();

    expect(products).toHaveLength(1);
    expect(repository.findPublicList).toHaveBeenCalledOnce();
  });

  it("returns public details by slug", async () => {
    const { service, repository } = createService();

    const product = await service.getPublicProductBySlug(
      "chocolate-truffle-cake",
    );

    expect(product.slug).toBe("chocolate-truffle-cake");
    expect(repository.findActiveBySlug).toHaveBeenCalledWith(
      "chocolate-truffle-cake",
    );
  });
});
