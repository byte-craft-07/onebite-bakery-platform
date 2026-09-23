import { Types, type HydratedDocument } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import type { CreateProductDto } from "../dto/index.js";
import type { Product } from "../model/index.js";
import type { InventoryRepository, ProductRepository } from "../repository/index.js";
import type { PublicProductQueryDto } from "../types/index.js";
import { ProductService } from "./product.service.js";

const context: RequestContext = {
  userId: new Types.ObjectId().toString(),
  userRole: "admin",
  requestId: "product-test",
};

const categoryId = new Types.ObjectId("507f1f77bcf86cd799439011");
const occasionId = new Types.ObjectId("507f1f77bcf86cd799439012");
const childProductId = new Types.ObjectId("507f1f77bcf86cd799439013");

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
    compareAtPrice: 599,
    costPrice: 300,
    taxCategory: "STANDARD_5",
    imageUrls: ["https://cdn.theonlinebakery.test/chocolate-truffle.webp"],
    thumbnailUrl: "https://cdn.theonlinebakery.test/chocolate-truffle-thumb.webp",
    stockQuantity: 10,
    lowStockThreshold: 5,
    trackInventory: true,
    allowBackorder: false,
    stockStatus: "IN_STOCK",
    isAvailable: true,
    deliveryEligible: true,
    pickupEligible: true,
    isActive: true,
    isFeatured: false,
    isTrending: false,
    isRecommended: false,
    isSeasonal: false,
    displayOrder: 1,
    seoTitle: "Chocolate Truffle Cake",
    seoDescription: "Order chocolate truffle cake from The Online Bakery.",
    seoKeywords: ["chocolate", "cake"],
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  return product as HydratedDocument<Product>;
};

const createDto = (): CreateProductDto => ({
  name: "Chocolate Truffle Cake",
  description: "Rich chocolate truffle cake for celebrations.",
  shortDescription: "Rich chocolate cake.",
  categoryId: categoryId.toString(),
  occasionIds: [occasionId.toString()],
  productType: "NORMAL",
  comboItems: [],
  price: 499,
  compareAtPrice: 599,
  costPrice: 300,
  taxCategory: "STANDARD_5",
  imageUrls: ["https://cdn.theonlinebakery.test/chocolate-truffle.webp"],
  thumbnailUrl: "https://cdn.theonlinebakery.test/chocolate-truffle-thumb.webp",
  stockQuantity: 10,
  lowStockThreshold: 5,
  trackInventory: true,
  allowBackorder: false,
  isAvailable: true,
  isActive: true,
  isFeatured: false,
  isTrending: false,
  isRecommended: false,
  isSeasonal: false,
  deliveryEligible: true,
  pickupEligible: true,
  displayOrder: 1,
  seoTitle: "Chocolate Truffle Cake",
  seoDescription: "Order chocolate truffle cake from The Online Bakery.",
  seoKeywords: ["chocolate", "cake"],
});

const createService = (
  overrides: Partial<Record<keyof ProductRepository, unknown>> = {},
  inventoryOverrides: Partial<Record<keyof InventoryRepository, unknown>> = {},
) => {
  const repository = {
    create: vi.fn().mockImplementation((data: Partial<Product>) =>
      Promise.resolve(createProductDocument(data)),
    ),
    findBySlug: vi.fn().mockResolvedValue(null),
    findActiveBySlug: vi.fn().mockResolvedValue(createProductDocument()),
    findPublicList: vi.fn().mockResolvedValue([createProductDocument()]),
    findAdminList: vi.fn().mockResolvedValue([createProductDocument()]),
    findPublicCatalog: vi.fn().mockResolvedValue({
      items: [createProductDocument()],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    }),
    findCategoryBySlugOrId: vi.fn().mockResolvedValue({
      _id: categoryId,
      name: "Cakes",
      slug: "cakes",
    }),
    findOccasionBySlugOrId: vi.fn().mockResolvedValue({
      _id: occasionId,
      name: "Birthday",
      slug: "birthday",
    }),
    findByIdIncludingDeleted: vi.fn().mockResolvedValue(createProductDocument()),
    updateById: vi.fn().mockImplementation(
      (_id: Types.ObjectId, update: { $set?: Partial<Product> }) =>
        Promise.resolve(createProductDocument(update.$set ?? {})),
    ),
    softDelete: vi.fn().mockResolvedValue(
      createProductDocument({
        isDeleted: true,
      }),
    ),
    categoryExists: vi.fn().mockResolvedValue(true),
    findMissingOccasionIds: vi.fn().mockResolvedValue([]),
    findExistingProduct: vi.fn().mockResolvedValue(createProductDocument()),
    ...overrides,
  } as unknown as ProductRepository;

  const inventoryRepository = {
    findByIdWithPrivatePricing: vi
      .fn()
      .mockResolvedValue(createProductDocument()),
    updateProductInventory: vi
      .fn()
      .mockImplementation(
        (_id: Types.ObjectId, update: { $set?: Partial<Product> }) =>
          Promise.resolve(createProductDocument(update.$set ?? {})),
      ),
    findMissingProductIds: vi.fn().mockResolvedValue([]),
    ...inventoryOverrides,
  } as unknown as InventoryRepository;

  return {
    service: new ProductService(repository, inventoryRepository),
    repository,
    inventoryRepository,
  };
};

describe("ProductService", () => {
  it("creates a product with a generated slug and calculated stock status", async () => {
    const { service, repository } = createService();

    const product = await service.createProduct(createDto(), context);

    expect(product.slug).toBe("chocolate-truffle-cake");
    expect(product.stockStatus).toBe("IN_STOCK");
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

  it("creates combo products with validated child products", async () => {
    const { service, inventoryRepository } = createService();

    const product = await service.createProduct(
      {
        ...createDto(),
        name: "Birthday Combo",
        productType: "COMBO",
        comboItems: [{ productId: childProductId.toString(), quantity: 2 }],
      },
      context,
    );

    expect(product.productType).toBe("COMBO");
    expect(product.comboItems).toEqual([
      { productId: childProductId.toString(), quantity: 2 },
    ]);
    expect(inventoryRepository.findMissingProductIds).toHaveBeenCalledOnce();
  });

  it("rejects combo products without child products", async () => {
    const { service } = createService();

    await expect(
      service.createProduct(
        { ...createDto(), productType: "COMBO", comboItems: [] },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects duplicate combo child products", async () => {
    const { service } = createService();

    await expect(
      service.createProduct(
        {
          ...createDto(),
          productType: "COMBO",
          comboItems: [
            { productId: childProductId.toString(), quantity: 1 },
            { productId: childProductId.toString(), quantity: 2 },
          ],
        },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects invalid combo child product references", async () => {
    const { service } = createService({}, {
      findMissingProductIds: vi.fn().mockResolvedValue([childProductId]),
    });

    await expect(
      service.createProduct(
        {
          ...createDto(),
          productType: "COMBO",
          comboItems: [{ productId: childProductId.toString(), quantity: 1 }],
        },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects combo self-reference during product update", async () => {
    const productId = new Types.ObjectId("507f1f77bcf86cd799439014");
    const { service } = createService({
      findExistingProduct: vi
        .fn()
        .mockResolvedValue(createProductDocument({ _id: productId })),
    });

    await expect(
      service.updateProduct(
        productId.toString(),
        {
          productType: "COMBO",
          comboItems: [{ productId: productId.toString(), quantity: 1 }],
        },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("queries public catalog with pagination, filtering, and sorting", async () => {
    const { service, repository } = createService();

    const result = await service.queryPublicCatalog({
      page: 1,
      limit: 10,
      sort: "price_asc",
      minPrice: 100,
      maxPrice: 600,
    });

    expect(result.products).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(repository.findPublicCatalog).toHaveBeenCalledOnce();
  });

  it("queries featured products shortcut endpoint", async () => {
    const { service, repository } = createService();

    const result = await service.listFeaturedProducts({ page: 1, limit: 10 });

    expect(result.products).toHaveLength(1);
    expect(repository.findPublicCatalog).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { isFeatured: true },
    );
  });

  it("queries trending products shortcut endpoint", async () => {
    const { service, repository } = createService();

    const result = await service.listTrendingProducts({ page: 1, limit: 10 });

    expect(result.products).toHaveLength(1);
    expect(repository.findPublicCatalog).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { isTrending: true },
    );
  });

  it("queries recommended products shortcut endpoint", async () => {
    const { service, repository } = createService();

    const result = await service.listRecommendedProducts({ page: 1, limit: 10 });

    expect(result.products).toHaveLength(1);
    expect(repository.findPublicCatalog).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { isRecommended: true },
    );
  });

  it("queries seasonal products shortcut endpoint", async () => {
    const { service, repository } = createService();

    const result = await service.listSeasonalProducts({ page: 1, limit: 10 });

    expect(result.products).toHaveLength(1);
    expect(repository.findPublicCatalog).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { isSeasonal: true },
    );
  });

  it("queries products by category slug", async () => {
    const { service, repository } = createService();

    const result = await service.listProductsByCategorySlug("cakes", {
      page: 1,
      limit: 10,
    });

    expect(result.category.slug).toBe("cakes");
    expect(result.products).toHaveLength(1);
    expect(repository.findCategoryBySlugOrId).toHaveBeenCalledWith("cakes");
  });

  it("throws 404 when querying products by non-existent category slug", async () => {
    const { service } = createService({
      findCategoryBySlugOrId: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.listProductsByCategorySlug("non-existent", { page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("queries products by occasion slug", async () => {
    const { service, repository } = createService();

    const result = await service.listProductsByOccasionSlug("birthday", {
      page: 1,
      limit: 10,
    });

    expect(result.occasion.slug).toBe("birthday");
    expect(result.products).toHaveLength(1);
    expect(repository.findOccasionBySlugOrId).toHaveBeenCalledWith("birthday");
  });

  it("throws 404 when querying products by non-existent occasion slug", async () => {
    const { service } = createService({
      findOccasionBySlugOrId: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.listProductsByOccasionSlug("non-existent", { page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("throws 404 when public slug lookup yields no active product", async () => {
    const { service } = createService({
      findActiveBySlug: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.getPublicProductBySlug("non-existent-cake"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("queries public catalog for Main branch without excluding products disabled in sub-branches", async () => {
    const { VillageModel } = await import("../../village/model/village.model.js");
    const { BranchModel } = await import("../../branch/model/branch.model.js");
    vi.spyOn(VillageModel, "findOne").mockReturnValue({ exec: vi.fn().mockResolvedValue(null) } as unknown as ReturnType<typeof VillageModel.findOne>);
    vi.spyOn(BranchModel, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        name: "Central Delhi HQ",
        type: "MAIN",
        code: "CD-01",
        isActive: true,
      }),
    } as unknown as ReturnType<typeof BranchModel.findOne>);

    const { service, repository } = createService();
    const result = await service.queryPublicCatalog({
      villageName: "Chandpur",
      district: "North Delhi",
    } as unknown as PublicProductQueryDto);

    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.isAvailable).toBe(true);
    expect(repository.findPublicCatalog).toHaveBeenCalled();
  });
});

