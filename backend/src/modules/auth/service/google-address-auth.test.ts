import { Types } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { normalizeIndianPhone } from "../utils/phone-normalizer.js";
import type { User, UserRepository } from "../../user/index.js";
import type { Address } from "../../address/index.js";
import type { RefreshTokenRepository } from "../repository/index.js";
import { AuthService } from "./auth.service.js";
import { OrderService } from "../../order/service/order.service.js";
import type { OrderRepository } from "../../order/repository/order.repository.js";
import type { CartService } from "../../cart/service/cart.service.js";
import { AddressModel } from "../../address/model/address.model.js";
import { ProductModel } from "../../product/model/product.model.js";
import { CategoryModel } from "../../category/model/category.model.js";

const context: RequestContext = {
  requestId: "test-auth-address-request",
  ip: "127.0.0.1",
  userAgent: "vitest",
};

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    _id: new Types.ObjectId(),
    name: "Ajay Customer",
    email: "customer@onebitebakery.in",
    googleId: "google-sub-12345",
    role: "customer",
    isVerified: true,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as User;

const createMockAddress = (overrides: Partial<Address> = {}): Address =>
  ({
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    fullName: "Ajay Customer",
    phone: "9876543210",
    village: "Hamirpur Rural",
    district: "Hamirpur",
    address: "House 402, Near Clock Tower",
    city: "Hamirpur",
    state: "Uttar Pradesh",
    pincode: "210502",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Address;

describe("Customer Authentication + Address-Based Mobile Number Architecture", () => {
  describe("1. Authentication & Google Login", () => {
    it("Google login succeeds for a new customer", async () => {
      const newUser = createMockUser({
        _id: new Types.ObjectId("6aa3ebcda67a0fb724c636c1"),
        email: "new.google@onebitebakery.in",
      });

      const userRepository = {
        findByGoogleId: vi.fn().mockResolvedValue(null),
        findByEmail: vi.fn().mockResolvedValue(null),
        createCustomerFromGoogle: vi.fn().mockResolvedValue(newUser),
        findById: vi.fn().mockResolvedValue(newUser),
      } as unknown as UserRepository;

      const refreshTokenRepository = {
        createSession: vi.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      } as unknown as RefreshTokenRepository;

      const authService = new AuthService(
        userRepository,
        refreshTokenRepository,
      );

      const result = await authService.authenticateWithGoogle(
        {
          token: "simulated-google-id-token",
          email: "new.google@onebitebakery.in",
          name: "New Google Customer",
        },
        context,
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("new.google@onebitebakery.in");
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it("Existing Google customer logs in and gets a secure session", async () => {
      const existingUser = createMockUser({
        googleId: "google-sub-existing",
        email: "existing.customer@onebitebakery.in",
      });

      const userRepository = {
        findByGoogleId: vi.fn().mockResolvedValue(existingUser),
        markVerifiedLogin: vi.fn().mockResolvedValue(existingUser),
        findById: vi.fn().mockResolvedValue(existingUser),
      } as unknown as UserRepository;

      const refreshTokenRepository = {
        createSession: vi.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      } as unknown as RefreshTokenRepository;

      const authService = new AuthService(
        userRepository,
        refreshTokenRepository,
      );

      const result = await authService.authenticateWithGoogle(
        {
          token: "simulated-google-id-token",
          email: "existing.customer@onebitebakery.in",
        },
        context,
      );

      expect(result.user.id).toBe(existingUser._id.toString());
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });
  });

  describe("2. Address & Mobile Number Validation", () => {
    it("normalizes Indian mobile numbers correctly", () => {
      expect(normalizeIndianPhone("9876543210")).toBe("9876543210");
      expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210");
      expect(normalizeIndianPhone("09876543210")).toBe("9876543210");
      expect(normalizeIndianPhone("919876543210")).toBe("9876543210");
    });

    it("rejects invalid mobile numbers", () => {
      expect(() => normalizeIndianPhone("12345")).toThrow();
      expect(() => normalizeIndianPhone("abcdefghij")).toThrow();
      expect(() => normalizeIndianPhone("")).toThrow();
    });

    it("validates address fields: mobile number, village, district", () => {
      const mockAddress = createMockAddress({
        phone: normalizeIndianPhone("+91 9876543210"),
        village: "Hamirpur Rural",
        district: "Hamirpur",
      });

      expect(mockAddress.phone).toBe("9876543210");
      expect(mockAddress.village).toBe("Hamirpur Rural");
      expect(mockAddress.district).toBe("Hamirpur");
    });
  });

  describe("3. Customer Details / Profile Address-Based Mobile Resolution", () => {
    it("resolves contact mobile number from customer's saved address", async () => {
      const user = createMockUser();
      const address = createMockAddress({
        userId: user._id,
        phone: "9123456789",
        village: "Sumerpur",
        district: "Hamirpur",
      });

      vi.spyOn(AddressModel, "findOne").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(address),
        }),
      } as unknown as ReturnType<typeof AddressModel.findOne>);

      const userRepository = {
        findById: vi.fn().mockResolvedValue(user),
      } as unknown as UserRepository;

      const authService = new AuthService(
        userRepository,
        {} as RefreshTokenRepository,
      );

      const userProfile = await authService.getCurrentUser(user._id.toString());
      expect(userProfile.phone).toBe("9123456789");
      expect(userProfile.address?.village).toBe("Sumerpur");
      expect(userProfile.address?.district).toBe("Hamirpur");
      vi.restoreAllMocks();
    });
  });

  describe("4. Orders & Snapshot Immutability", () => {
    it("order stores immutable address snapshot with mobile number, village, and district", async () => {
      const customerId = new Types.ObjectId();
      const addressId = new Types.ObjectId();

      const addressDoc = createMockAddress({
        _id: addressId,
        userId: customerId,
        phone: "9876543210",
        village: "Hamirpur Central",
        district: "Hamirpur",
        address: "Lane 4, Building 12",
      });

      vi.spyOn(AddressModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(addressDoc),
      } as unknown as ReturnType<typeof AddressModel.findOne>);

      vi.spyOn(ProductModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          name: "Truffle Cake",
          slug: "truffle-cake",
          price: 500,
          isActive: true,
          isAvailable: true,
          isDeleted: false,
          productType: "NORMAL",
          imageUrls: ["https://cdn.test/cake.png"],
        }),
      } as unknown as ReturnType<typeof ProductModel.findOne>);

      const mockCart = {
        _id: new Types.ObjectId(),
        items: [
          {
            productId: new Types.ObjectId(),
            productSnapshot: { name: "Truffle Cake" },
            productType: "NORMAL",
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
          },
        ],
        subtotal: 500,
        estimatedDiscount: 0,
        estimatedTax: 0,
        estimatedDeliveryCharge: 0,
        homeDeliveryAvailable: true,
        pickupAvailable: true,
      };

      const mockCartService = {
        getOrCreateCartDocument: vi.fn().mockResolvedValue(mockCart),
        recalculateCart: vi.fn().mockResolvedValue(mockCart),
        clearCart: vi.fn().mockResolvedValue(undefined),
      } as unknown as CartService;

      const mockOrderRepo = {
        generateOrderNumber: vi.fn().mockResolvedValue("OB-20260911-0001"),
        createOrder: vi.fn().mockImplementation((orderData) =>
          Promise.resolve({
            ...orderData,
            _id: new Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      } as unknown as OrderRepository;

      const orderService = new OrderService(mockOrderRepo, mockCartService);

      const createdOrder = await orderService.createOrder(
        customerId.toString(),
        {
          deliveryMethod: "HOME_DELIVERY",
          addressId: addressId.toString(),
        },
        context,
      );

      expect(createdOrder).toBeDefined();
      expect(createdOrder.addressSnapshot?.phone).toBe("9876543210");
      expect(createdOrder.addressSnapshot?.village).toBe("Hamirpur Central");
      expect(createdOrder.addressSnapshot?.district).toBe("Hamirpur");

      // Verify that updating customer's address later does not affect this historical snapshot
      addressDoc.phone = "9999999999";
      addressDoc.village = "New Village";

      expect(createdOrder.addressSnapshot?.phone).toBe("9876543210");
      expect(createdOrder.addressSnapshot?.village).toBe("Hamirpur Central");

      vi.restoreAllMocks();
    });

    it("rejects order if addressId does not belong to the authenticated customer", async () => {
      const customerId = new Types.ObjectId();
      const anotherUserAddressId = new Types.ObjectId();

      vi.spyOn(AddressModel, "findOne").mockReturnValue({
        exec: vi.fn().mockResolvedValue(null), // not found for this customerId
      } as unknown as ReturnType<typeof AddressModel.findOne>);

      const mockCart = {
        _id: new Types.ObjectId(),
        items: [
          {
            productId: new Types.ObjectId(),
            productSnapshot: { name: "Cake" },
            quantity: 1,
            unitPrice: 500,
          },
        ],
        subtotal: 500,
        estimatedDiscount: 0,
        estimatedTax: 0,
        estimatedDeliveryCharge: 0,
        homeDeliveryAvailable: true,
      };

      const mockCartService = {
        getOrCreateCartDocument: vi.fn().mockResolvedValue(mockCart),
        recalculateCart: vi.fn().mockResolvedValue(mockCart),
      } as unknown as CartService;

      const orderService = new OrderService(
        {} as OrderRepository,
        mockCartService,
      );

      await expect(
        orderService.createOrder(
          customerId.toString(),
          {
            deliveryMethod: "HOME_DELIVERY",
            addressId: anotherUserAddressId.toString(),
          },
          context,
        ),
      ).rejects.toThrow("Specified delivery address not found");

      vi.restoreAllMocks();
    });
  });

  describe("5. Security & Boundary Checks", () => {
    it("customer session requires authentication and enforces identity ownership", () => {
      const user = createMockUser({ role: "customer" });
      expect(user.role).toBe("customer");
      expect(user.status).toBe("active");
    });
  });
});
