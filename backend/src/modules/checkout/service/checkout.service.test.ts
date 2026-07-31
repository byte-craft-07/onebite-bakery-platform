import { Types, type HydratedDocument } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import { AddressModel } from "../../address/index.js";
import type { Cart, CartRepository } from "../../cart/index.js";
import { ProductModel, type Product } from "../../product/index.js";
import { SettingsModel } from "../../settings/index.js";
import { CheckoutService } from "./checkout.service.js";

const customerId = new Types.ObjectId().toString();
const productId = new Types.ObjectId();
const addressId = new Types.ObjectId();

const createMockProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    _id: productId,
    name: "Chocolate Truffle Cake",
    slug: "chocolate-truffle-cake",
    description: "Delicious cake",
    categoryId: new Types.ObjectId(),
    productType: "NORMAL",
    price: 500,
    costPrice: 300,
    taxCategory: "STANDARD_5",
    imageUrls: ["https://cdn.onebite.test/chocolate.webp"],
    thumbnailUrl: "https://cdn.onebite.test/chocolate-thumb.webp",
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
    userId: new Types.ObjectId(customerId),
    customerId: new Types.ObjectId(customerId),
    items: [
      {
        _id: new Types.ObjectId(),
        productId,
        quantity: 1,
        unitPriceSnapshot: 500,
        unitPrice: 500,
        totalPrice: 500,
        productType: "NORMAL",
        productSnapshot: {
          name: "Chocolate Truffle Cake",
          slug: "chocolate-truffle-cake",
          productType: "NORMAL",
        },
        addedAt: new Date(),
      },
    ],
    totalItems: 1,
    subtotal: 500,
    estimatedDiscount: 0,
    estimatedTax: 0,
    estimatedDeliveryCharge: 50,
    grandTotal: 550,
    homeDeliveryAvailable: true,
    pickupAvailable: true,
    appliedOffers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  return cart as unknown as HydratedDocument<Cart>;
};

const createService = (
  cartRepoOverrides: Partial<Record<keyof CartRepository, unknown>> = {},
) => {
  const cartRepository = {
    findActiveCart: vi
      .fn()
      .mockResolvedValue(createMockCartDocument()),
    ...cartRepoOverrides,
  } as unknown as CartRepository;

  return {
    service: new CheckoutService(cartRepository),
    cartRepository,
  };
};

describe("CheckoutService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct()),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    vi.spyOn(AddressModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue({
        _id: addressId,
        userId: new Types.ObjectId(customerId),
        fullName: "Jane Doe",
        phone: "9876543210",
        address: "123 Baker Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      }),
    } as unknown as ReturnType<typeof AddressModel.findOne>));

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

  it("generates checkout summary for home delivery when subtotal exceeds threshold", async () => {
    const { service } = createService();

    const summary = await service.getCheckoutSummary(customerId, {
      deliveryMethod: "HOME_DELIVERY",
      addressId: addressId.toString(),
    });

    expect(summary.subtotal).toBe(500);
    expect(summary.homeDeliveryEligible).toBe(true);
    expect(summary.pickupEligible).toBe(true);
    expect(summary.selectedAddress).toBeDefined();
    expect(summary.validationErrors).toHaveLength(0);
  });

  it("generates pickup checkout summary without requiring delivery address", async () => {
    const { service } = createService();

    const summary = await service.getCheckoutSummary(customerId, {
      deliveryMethod: "STORE_PICKUP",
    });

    expect(summary.pickupEligible).toBe(true);
    expect(summary.selectedAddress).toBeUndefined();
    expect(summary.validationErrors).toHaveLength(0);
  });

  it("flags warning and disables home delivery when subtotal is below minimum threshold", async () => {
    const lowValueCart = createMockCartDocument({
      items: [
        {
          _id: new Types.ObjectId(),
          productId,
          quantity: 1,
          unitPriceSnapshot: 150,
          unitPrice: 150,
          totalPrice: 150,
          productType: "NORMAL",
          productSnapshot: {
            name: "Cupcake",
            slug: "cupcake",
            productType: "NORMAL",
          },
          addedAt: new Date(),
        },
      ],
      subtotal: 150,
    });

    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct({ price: 150 })),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    const { service } = createService({
      findActiveCart: vi.fn().mockResolvedValue(lowValueCart),
    });

    const summary = await service.getCheckoutSummary(customerId, {
      deliveryMethod: "HOME_DELIVERY",
    });

    expect(summary.homeDeliveryEligible).toBe(false);
    expect(summary.pickupEligible).toBe(true);
    expect(summary.warnings).toHaveLength(1);
  });

  it("rejects checkout summary request when cart is empty", async () => {
    const emptyCart = createMockCartDocument({ items: [], totalItems: 0 });
    const { service } = createService({
      findActiveCart: vi.fn().mockResolvedValue(emptyCart),
    });

    await expect(
      service.getCheckoutSummary(customerId, {}),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("flags inactive products as validation errors in checkout summary", async () => {
    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct({ isActive: false })),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    const { service } = createService();

    const summary = await service.getCheckoutSummary(customerId, {});

    expect(summary.validationErrors).toHaveLength(1);
    expect(summary.items[0]?.isAvailable).toBe(false);
  });

  it("flags unavailable products as validation errors in checkout summary", async () => {
    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct({ isAvailable: false })),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    const { service } = createService();

    const summary = await service.getCheckoutSummary(customerId, {});

    expect(summary.validationErrors).toHaveLength(1);
  });

  it("flags invalid or non-owned address in checkout summary", async () => {
    vi.spyOn(AddressModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof AddressModel.findOne>));

    const { service } = createService();

    const summary = await service.getCheckoutSummary(customerId, {
      addressId: new Types.ObjectId().toString(),
    });

    expect(summary.validationErrors).toHaveLength(1);
  });

  it("validates checkout payload and returns isValid: true when all rules pass", async () => {
    const { service } = createService();

    const result = await service.validateCheckout(customerId, {
      deliveryMethod: "HOME_DELIVERY",
      addressId: addressId.toString(),
    });

    expect(result.isValid).toBe(true);
    expect(result.deliveryMethod).toBe("HOME_DELIVERY");
  });

  it("rejects validation when home delivery is attempted below minimum threshold", async () => {
    const lowValueCart = createMockCartDocument({
      items: [
        {
          _id: new Types.ObjectId(),
          productId,
          quantity: 1,
          unitPriceSnapshot: 150,
          unitPrice: 150,
          totalPrice: 150,
          productType: "NORMAL",
          productSnapshot: {
            name: "Cupcake",
            slug: "cupcake",
            productType: "NORMAL",
          },
          addedAt: new Date(),
        },
      ],
      subtotal: 150,
    });

    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct({ price: 150 })),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    const { service } = createService({
      findActiveCart: vi.fn().mockResolvedValue(lowValueCart),
    });

    await expect(
      service.validateCheckout(customerId, {
        deliveryMethod: "HOME_DELIVERY",
        addressId: addressId.toString(),
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
