import { Types, type HydratedDocument } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import type { Product } from "../model/index.js";
import type { InventoryRepository } from "../repository/index.js";
import { InventoryService } from "./inventory.service.js";

const context: RequestContext = {
  userId: new Types.ObjectId().toString(),
  userRole: "admin",
  requestId: "inventory-test",
};

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
    categoryId: new Types.ObjectId(),
    productType: "NORMAL",
    occasionIds: [],
    comboItems: [],
    price: 499,
    compareAtPrice: 599,
    costPrice: 300,
    taxCategory: "STANDARD_5",
    imageUrls: ["https://cdn.onebite.test/chocolate-truffle.webp"],
    thumbnailUrl: "https://cdn.onebite.test/chocolate-truffle-thumb.webp",
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
    seoDescription: "Order chocolate truffle cake from OneBite Bakery.",
    seoKeywords: ["chocolate", "cake"],
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  return product as HydratedDocument<Product>;
};

const createService = (
  overrides: Partial<Record<keyof InventoryRepository, unknown>> = {},
) => {
  const repository = {
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
    ...overrides,
  } as unknown as InventoryRepository;

  return {
    service: new InventoryService(repository),
    repository,
  };
};

describe("InventoryService", () => {
  it("returns owner inventory with private pricing", async () => {
    const { service } = createService();

    const inventory = await service.getInventory(new Types.ObjectId().toString());

    expect(inventory.costPrice).toBe(300);
    expect(inventory.stockQuantity).toBe(10);
  });

  it("updates pricing without exposing raw persistence details", async () => {
    const { service, repository } = createService();

    const inventory = await service.updatePricing(
      new Types.ObjectId().toString(),
      {
        price: 450,
        compareAtPrice: 500,
        costPrice: 250,
        taxCategory: "STANDARD_5",
      },
      context,
    );

    expect(inventory.price).toBe(450);
    expect(inventory.costPrice).toBe(250);
    expect(repository.updateProductInventory).toHaveBeenCalledOnce();
  });

  it("marks low stock when quantity is at or below threshold", async () => {
    const { service } = createService();

    const inventory = await service.updateInventory(
      new Types.ObjectId().toString(),
      {
        stockQuantity: 3,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      context,
    );

    expect(inventory.stockStatus).toBe("LOW_STOCK");
  });

  it("marks out of stock when tracked quantity is zero", async () => {
    const { service } = createService();

    const inventory = await service.updateInventory(
      new Types.ObjectId().toString(),
      {
        stockQuantity: 0,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
      },
      context,
    );

    expect(inventory.stockStatus).toBe("OUT_OF_STOCK");
  });

  it("uses pre-order when backorder is allowed and stock is zero", async () => {
    const { service } = createService();

    const inventory = await service.updateInventory(
      new Types.ObjectId().toString(),
      {
        stockQuantity: 0,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: true,
      },
      context,
    );

    expect(inventory.stockStatus).toBe("PRE_ORDER");
  });

  it("updates availability windows", async () => {
    const { service } = createService();
    const availableFrom = new Date("2026-08-01T00:00:00.000Z");
    const availableUntil = new Date("2026-08-31T23:59:59.000Z");

    const inventory = await service.updateAvailability(
      new Types.ObjectId().toString(),
      {
        isAvailable: true,
        deliveryEligible: true,
        pickupEligible: true,
        availableFrom,
        availableUntil,
      },
      context,
    );

    expect(inventory.availableFrom).toEqual(availableFrom);
    expect(inventory.availableUntil).toEqual(availableUntil);
  });

  it("throws not found when inventory product is missing", async () => {
    const { service } = createService({
      findByIdWithPrivatePricing: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.getInventory(new Types.ObjectId().toString()),
    ).rejects.toBeInstanceOf(AppError);
  });
});
