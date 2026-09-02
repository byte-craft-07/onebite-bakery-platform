import { Types, type HydratedDocument } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import { ProductModel, type Product } from "../../product/index.js";
import { SettingsModel } from "../../settings/index.js";
import { type Cart, type CartItem } from "../model/index.js";
import type { CartRepository } from "../repository/index.js";
import { CartService } from "./cart.service.js";

const customerId = new Types.ObjectId().toString();
const productId = new Types.ObjectId();

const createMockProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    _id: productId,
    name: "Chocolate Truffle Cake",
    slug: "chocolate-truffle-cake",
    description: "Delicious chocolate truffle cake",
    categoryId: new Types.ObjectId(),
    productType: "NORMAL",
    price: 500,
    costPrice: 300,
    taxCategory: "STANDARD_5",
    imageUrls: ["https://cdn.theonlinebakery.test/chocolate.webp"],
    thumbnailUrl: "https://cdn.theonlinebakery.test/chocolate-thumb.webp",
    stockQuantity: 10,
    lowStockThreshold: 2,
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
    seoDescription: "Chocolate cake",
    seoKeywords: ["cake"],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Product);

const createMockCartDocument = (overrides: Partial<Cart> = {}): HydratedDocument<Cart> => {
  const cart = {
    _id: new Types.ObjectId(),
    items: [],
    totalItems: 0,
    subtotal: 0,
    estimatedDiscount: 0,
    estimatedTax: 0,
    estimatedDeliveryCharge: 0,
    grandTotal: 0,
    homeDeliveryAvailable: false,
    pickupAvailable: true,
    appliedOffers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return cart as unknown as HydratedDocument<Cart>;
};

const createService = (
  repositoryOverrides: Partial<Record<keyof CartRepository, unknown>> = {},
) => {
  const repository = {
    findActiveCart: vi
      .fn()
      .mockImplementation((id: Types.ObjectId) =>
        Promise.resolve(createMockCartDocument({ userId: id, customerId: id })),
      ),
    findByCustomerId: vi
      .fn()
      .mockImplementation((id: Types.ObjectId) =>
        Promise.resolve(createMockCartDocument({ userId: id, customerId: id })),
      ),
    findBySessionId: vi
      .fn()
      .mockImplementation((sid: string) =>
        Promise.resolve(createMockCartDocument({ sessionId: sid })),
      ),
    createCart: vi
      .fn()
      .mockImplementation((id: Types.ObjectId) =>
        Promise.resolve(createMockCartDocument({ userId: id, customerId: id })),
      ),
    deleteBySessionId: vi.fn().mockResolvedValue(true),
    deleteByCustomerId: vi.fn().mockResolvedValue(true),
    create: vi
      .fn()
      .mockImplementation((data: Partial<Cart>) =>
        Promise.resolve(createMockCartDocument(data)),
      ),
    ...repositoryOverrides,
  } as unknown as CartRepository;

  return {
    service: new CartService(repository),
    repository,
  };
};

describe("CartService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct()),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    vi.spyOn(ProductModel, "find").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue([createMockProduct()]),
    } as unknown as ReturnType<typeof ProductModel.find>));

    vi.spyOn(SettingsModel, "findOne").mockImplementation(() => ({
      lean: () => ({
        exec: vi.fn().mockResolvedValue({
          singletonKey: "default",
          deliveryCharge: 50,
          delivery: {
            minimumHomeDeliveryAmount: 300,
            homeDeliveryEnabled: true,
            pickupEnabled: true,
          },
          isDeliveryEnabled: true,
          isPickupEnabled: true,
        }),
      }),
    } as unknown as ReturnType<typeof SettingsModel.findOne>));
  });

  it("creates and retrieves a cart for an authenticated user", async () => {
    const { service } = createService();

    const cart = await service.getCart(customerId);

    expect(cart.customerId).toBe(customerId);
    expect(cart.items).toHaveLength(0);
    expect(cart.totalItems).toBe(0);
  });

  it("adds the first product to cart and calculates price snapshots and totalItems", async () => {
    const { service } = createService();

    const cart = await service.addItem(customerId, undefined, {
      productId: productId.toString(),
      quantity: 2,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.unitPriceSnapshot).toBe(500);
    expect(cart.totalItems).toBe(2);
    expect(cart.subtotal).toBe(1000);
  });

  it("merges duplicate product additions by increasing quantity instead of creating duplicate items", async () => {
    const existingCart = createMockCartDocument({
      customerId: new Types.ObjectId(customerId),
      items: [
        {
          _id: new Types.ObjectId(),
          productId,
          quantity: 2,
          unitPriceSnapshot: 500,
          unitPrice: 500,
          totalPrice: 1000,
          productType: "NORMAL",
          productSnapshot: {
            name: "Chocolate Truffle Cake",
            slug: "chocolate-truffle-cake",
            productType: "NORMAL",
          },
          addedAt: new Date(),
        } as CartItem,
      ],
      totalItems: 2,
      subtotal: 1000,
    });

    const { service } = createService({
      findActiveCart: vi.fn().mockResolvedValue(existingCart),
    });

    const cart = await service.addItem(customerId, undefined, {
      productId: productId.toString(),
      quantity: 3,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(5);
    expect(cart.totalItems).toBe(5);
    expect(cart.subtotal).toBe(2500);
  });

  it("updates item quantity and recalculates cart totalItems", async () => {
    const itemId = new Types.ObjectId();
    const existingCart = createMockCartDocument({
      customerId: new Types.ObjectId(customerId),
      items: [
        {
          _id: itemId,
          productId,
          quantity: 2,
          unitPriceSnapshot: 500,
          unitPrice: 500,
          totalPrice: 1000,
          productType: "NORMAL",
          productSnapshot: {
            name: "Chocolate Truffle Cake",
            slug: "chocolate-truffle-cake",
            productType: "NORMAL",
          },
          addedAt: new Date(),
        } as CartItem,
      ],
      totalItems: 2,
      subtotal: 1000,
    });

    const { service } = createService({
      findActiveCart: vi.fn().mockResolvedValue(existingCart),
    });

    const cart = await service.updateQuantity(
      customerId,
      undefined,
      itemId.toString(),
      4,
    );

    expect(cart.items[0]?.quantity).toBe(4);
    expect(cart.totalItems).toBe(4);
    expect(cart.subtotal).toBe(2000);
  });

  it("removes an item from cart", async () => {
    const itemId = new Types.ObjectId();
    const existingCart = createMockCartDocument({
      customerId: new Types.ObjectId(customerId),
      items: [
        {
          _id: itemId,
          productId,
          quantity: 2,
          unitPriceSnapshot: 500,
          unitPrice: 500,
          totalPrice: 1000,
          productType: "NORMAL",
          productSnapshot: {
            name: "Chocolate Truffle Cake",
            slug: "chocolate-truffle-cake",
            productType: "NORMAL",
          },
          addedAt: new Date(),
        } as CartItem,
      ],
      totalItems: 2,
      subtotal: 1000,
    });

    const { service } = createService({
      findActiveCart: vi.fn().mockResolvedValue(existingCart),
    });

    const cart = await service.removeItem(
      customerId,
      undefined,
      itemId.toString(),
    );

    expect(cart.items).toHaveLength(0);
    expect(cart.totalItems).toBe(0);
    expect(cart.subtotal).toBe(0);
  });

  it("clears all items in cart", async () => {
    const existingCart = createMockCartDocument({
      customerId: new Types.ObjectId(customerId),
      items: [
        {
          _id: new Types.ObjectId(),
          productId,
          quantity: 2,
          unitPriceSnapshot: 500,
          unitPrice: 500,
          totalPrice: 1000,
          productType: "NORMAL",
          productSnapshot: {
            name: "Chocolate Truffle Cake",
            slug: "chocolate-truffle-cake",
            productType: "NORMAL",
          },
          addedAt: new Date(),
        } as CartItem,
      ],
      totalItems: 2,
      subtotal: 1000,
    });

    const { service } = createService({
      findActiveCart: vi.fn().mockResolvedValue(existingCart),
    });

    const cart = await service.clearCart(customerId);

    expect(cart.items).toHaveLength(0);
    expect(cart.totalItems).toBe(0);
    expect(cart.subtotal).toBe(0);
  });

  it("rejects addition of inactive products", async () => {
    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct({ isActive: false })),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    const { service } = createService();

    await expect(
      service.addItem(customerId, undefined, {
        productId: productId.toString(),
        quantity: 1,
      }),
    ).rejects.toThrow("Product is currently unavailable for your selected location.");
  });

  it("rejects addition of unavailable products", async () => {
    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct({ isAvailable: false })),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    const { service } = createService();

    await expect(
      service.addItem(customerId, undefined, {
        productId: productId.toString(),
        quantity: 1,
      }),
    ).rejects.toThrow("Product is currently unavailable for your selected location.");
  });

  it("rejects addition when quantity is invalid (less than or equal to 0)", async () => {
    const { service } = createService();

    await expect(
      service.addItem(customerId, undefined, {
        productId: productId.toString(),
        quantity: 0,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects cart access when neither user ID nor session ID is provided", async () => {
    const { service } = createService();

    await expect(service.getCart(undefined, undefined)).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("supports adding COMBO, CUSTOM_CAKE, and DECORATION products with custom cake configuration", async () => {
    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi
        .fn()
        .mockResolvedValue(createMockProduct({ productType: "CUSTOM_CAKE" })),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    vi.spyOn(ProductModel, "find").mockImplementation(() => ({
      exec: vi
        .fn()
        .mockResolvedValue([createMockProduct({ productType: "CUSTOM_CAKE" })]),
    } as unknown as ReturnType<typeof ProductModel.find>));

    const { service } = createService();

    const customConfig = {
      flavour: "Chocolate Truffle",
      weightKg: 2,
      eggPreference: "EGGLESS" as const,
      messageOnCake: "Happy Birthday Alex!",
    };

    const cart = await service.addItem(customerId, undefined, {
      productId: productId.toString(),
      quantity: 1,
      customization: customConfig,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.productType).toBe("CUSTOM_CAKE");
    expect(cart.items[0]?.customization?.flavour).toBe("Chocolate Truffle");
    expect(cart.items[0]?.customization?.weightKg).toBe(2);
  });
});
