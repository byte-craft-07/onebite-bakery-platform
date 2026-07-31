import { Types, type HydratedDocument } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { AddressModel } from "../../address/index.js";
import type { CartResponse, CartService } from "../../cart/index.js";
import { CategoryModel } from "../../category/index.js";
import { ProductModel, type Product } from "../../product/index.js";
import { SettingsModel } from "../../settings/index.js";
import { OrderModel, type Order } from "../model/index.js";
import type { OrderRepository } from "../repository/index.js";
import { OrderService } from "./order.service.js";

const customerId = new Types.ObjectId().toString();
const otherCustomerId = new Types.ObjectId().toString();
const productId = new Types.ObjectId();
const addressId = new Types.ObjectId();

const context: RequestContext = {
  userId: customerId,
  userRole: "customer",
  requestId: "order-test",
};

const createMockProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    _id: productId,
    name: "Chocolate Truffle Cake",
    slug: "chocolate-truffle-cake",
    description: "Rich chocolate truffle cake",
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

const createMockCartResponse = (overrides: Partial<CartResponse> = {}): CartResponse => ({
  id: "cart-id-123",
  customerId,
  items: [
    {
      id: "item-id-123",
      productId: productId.toString(),
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
    },
  ],
  totalItems: 2,
  subtotal: 1000,
  estimatedDiscount: 0,
  estimatedTax: 0,
  estimatedDeliveryCharge: 50,
  grandTotal: 1050,
  homeDeliveryAvailable: true,
  pickupAvailable: true,
  appliedOffers: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockOrderDocument = (overrides: Partial<Order> = {}): HydratedDocument<Order> => {
  const order = {
    _id: new Types.ObjectId(),
    orderNumber: "OB-20260731-TEST01",
    customerId: new Types.ObjectId(customerId),
    userId: new Types.ObjectId(customerId),
    items: [
      {
        productId,
        productNameSnapshot: "Chocolate Truffle Cake",
        productName: "Chocolate Truffle Cake",
        slug: "chocolate-truffle-cake",
        productType: "NORMAL",
        unitPriceSnapshot: 500,
        unitPrice: 500,
        quantity: 2,
        subtotal: 1000,
      },
    ],
    pricingSnapshot: {
      subtotal: 1000,
      tax: 0,
      deliveryCharge: 50,
      discount: 0,
      grandTotal: 1050,
      homeDeliveryAvailable: true,
      pickupAvailable: true,
    },
    subtotal: 1000,
    deliveryCharge: 50,
    totalAmount: 1050,
    deliveryMethod: "HOME_DELIVERY",
    orderStatus: "PENDING",
    paymentStatus: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return order as unknown as HydratedDocument<Order>;
};

const createService = (
  orderRepoOverrides: Partial<Record<keyof OrderRepository, unknown>> = {},
  cartServiceOverrides: Partial<Record<keyof CartService, unknown>> = {},
) => {
  const orderRepository = {
    create: vi
      .fn()
      .mockImplementation((data: Partial<Order>) =>
        Promise.resolve(createMockOrderDocument(data)),
      ),
    createOrder: vi
      .fn()
      .mockImplementation((data: Partial<Order>) =>
        Promise.resolve(createMockOrderDocument(data)),
      ),
    findById: vi.fn().mockResolvedValue(createMockOrderDocument()),
    findByOrderNumber: vi.fn().mockResolvedValue(createMockOrderDocument()),
    findCustomerOrders: vi.fn().mockResolvedValue({
      items: [createMockOrderDocument()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    updateStatus: vi
      .fn()
      .mockImplementation((_id, status, reason) =>
        Promise.resolve(
          createMockOrderDocument({
            orderStatus: status,
            ...(reason ? { cancellationReason: reason } : {}),
          }),
        ),
      ),
    findAllOrders: vi.fn().mockResolvedValue({
      items: [createMockOrderDocument()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    ...orderRepoOverrides,
  } as unknown as OrderRepository;

  const cartService = {
    getOrCreateCartDocument: vi.fn().mockResolvedValue({
      items: [
        {
          productId,
          quantity: 2,
          productSnapshot: { name: "Chocolate Truffle Cake", slug: "chocolate-truffle-cake", productType: "NORMAL" },
        },
      ],
      subtotal: 1000,
      estimatedDiscount: 0,
      estimatedTax: 0,
      estimatedDeliveryCharge: 50,
      grandTotal: 1050,
      homeDeliveryAvailable: true,
      pickupAvailable: true,
    }),
    recalculateCart: vi.fn().mockResolvedValue(undefined),
    clearCart: vi.fn().mockResolvedValue(createMockCartResponse({ items: [] })),
    getCart: vi.fn().mockResolvedValue(createMockCartResponse()),
    addItem: vi.fn().mockResolvedValue(createMockCartResponse()),
    ...cartServiceOverrides,
  } as unknown as CartService;

  return {
    service: new OrderService(orderRepository, cartService),
    orderRepository,
    cartService,
  };
};

describe("OrderService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

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

    vi.spyOn(ProductModel, "findOne").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockProduct()),
    } as unknown as ReturnType<typeof ProductModel.findOne>));

    vi.spyOn(CategoryModel, "findById").mockImplementation(() => ({
      lean: () => ({
        exec: vi.fn().mockResolvedValue({ name: "Cakes" }),
      }),
    } as unknown as ReturnType<typeof CategoryModel.findById>));

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
        }),
      }),
    } as unknown as ReturnType<typeof SettingsModel.findOne>));
  });

  it("creates a home delivery order with immutable item snapshots and clears cart", async () => {
    const { service, orderRepository, cartService } = createService();

    const order = await service.createOrder(
      customerId,
      {
        deliveryMethod: "HOME_DELIVERY",
        addressId: addressId.toString(),
      },
      context,
    );

    expect(order.deliveryMethod).toBe("HOME_DELIVERY");
    expect(order.orderStatus).toBe("PENDING");
    expect(order.paymentStatus).toBe("PENDING");
    expect(order.items).toHaveLength(1);
    expect(order.addressSnapshot?.city).toBe("Mumbai");
    expect(orderRepository.createOrder).toHaveBeenCalledOnce();
    expect(cartService.clearCart).toHaveBeenCalledWith(customerId);
  });

  it("creates a store pickup order without requiring delivery address", async () => {
    const { service, orderRepository } = createService();

    const order = await service.createOrder(
      customerId,
      {
        deliveryMethod: "STORE_PICKUP",
      },
      context,
    );

    expect(order.deliveryMethod).toBe("STORE_PICKUP");
    expect(order.addressSnapshot).toBeUndefined();
    expect(orderRepository.createOrder).toHaveBeenCalledOnce();
  });

  it("preserves cart when order creation fails due to empty cart", async () => {
    const { service, cartService } = createService(
      {},
      {
        getOrCreateCartDocument: vi.fn().mockResolvedValue({
          items: [],
          subtotal: 0,
        }),
      },
    );

    await expect(
      service.createOrder(
        customerId,
        { deliveryMethod: "STORE_PICKUP" },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);

    expect(cartService.clearCart).not.toHaveBeenCalled();
  });

  it("rejects home delivery when cart homeDeliveryAvailable is false", async () => {
    const { service } = createService(
      {},
      {
        getOrCreateCartDocument: vi.fn().mockResolvedValue({
          items: [{ productId, quantity: 1 }],
          subtotal: 150,
          homeDeliveryAvailable: false,
        }),
      },
    );

    await expect(
      service.createOrder(
        customerId,
        { deliveryMethod: "HOME_DELIVERY", addressId: addressId.toString() },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("prevents customer from viewing another customer's order", async () => {
    const { service } = createService({
      findById: vi.fn().mockResolvedValue(
        createMockOrderDocument({
          customerId: new Types.ObjectId(otherCustomerId),
          userId: new Types.ObjectId(otherCustomerId),
        }),
      ),
    });

    await expect(
      service.getCustomerOrderById(customerId, new Types.ObjectId().toString()),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("allows customer order cancellation when status is PENDING", async () => {
    const mockOrder = createMockOrderDocument({ orderStatus: "PENDING" });
    const { service, orderRepository } = createService({
      findById: vi.fn().mockResolvedValue(mockOrder),
    });

    const cancelledOrder = await service.cancelCustomerOrder(
      customerId,
      mockOrder._id.toString(),
      { cancellationReason: "Changed my mind" },
      context,
    );

    expect(cancelledOrder.orderStatus).toBe("CANCELLED");
    expect(orderRepository.updateStatus).toHaveBeenCalledOnce();
  });

  it("rejects customer order cancellation when status is PREPARING", async () => {
    const mockOrder = createMockOrderDocument({ orderStatus: "PREPARING" });
    const { service } = createService({
      findById: vi.fn().mockResolvedValue(mockOrder),
    });

    await expect(
      service.cancelCustomerOrder(
        customerId,
        mockOrder._id.toString(),
        {},
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("allows admin status state transition from PENDING to CONFIRMED to PREPARING", async () => {
    const mockOrder = createMockOrderDocument({ orderStatus: "PENDING" });
    const { service } = createService({
      findById: vi.fn().mockResolvedValue(mockOrder),
    });

    const updatedOrder = await service.adminUpdateOrderStatus(
      mockOrder._id.toString(),
      { status: "CONFIRMED" },
      { ...context, userRole: "admin" },
    );

    expect(updatedOrder.orderStatus).toBe("CONFIRMED");
  });

  it("rejects invalid admin status transition (e.g. PENDING -> DELIVERED directly)", async () => {
    const mockOrder = createMockOrderDocument({ orderStatus: "PENDING" });
    const { service } = createService({
      findById: vi.fn().mockResolvedValue(mockOrder),
    });

    await expect(
      service.adminUpdateOrderStatus(
        mockOrder._id.toString(),
        { status: "DELIVERED" },
        { ...context, userRole: "admin" },
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("reorders previous order items into customer cart and identifies skipped unavailable products", async () => {
    const mockOrder = createMockOrderDocument({
      items: [
        {
          productId,
          productNameSnapshot: "Chocolate Truffle Cake",
          productName: "Chocolate Truffle Cake",
          slug: "chocolate-truffle-cake",
          productType: "NORMAL",
          unitPriceSnapshot: 500,
          unitPrice: 500,
          quantity: 1,
          subtotal: 500,
        },
      ],
    });

    const { service, cartService } = createService({
      findById: vi.fn().mockResolvedValue(mockOrder),
    });

    const result = await service.reorder(customerId, mockOrder._id.toString());

    expect(cartService.clearCart).toHaveBeenCalledWith(customerId);
    expect(cartService.addItem).toHaveBeenCalledOnce();
    expect(result.skippedItems).toHaveLength(0);
  });
});
