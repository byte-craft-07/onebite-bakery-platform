import { Types } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import type { RequestContext } from "../../../shared/types/request-context.types.js";
import type { User, UserRepository } from "../../user/index.js";
import type { RefreshTokenRepository } from "../repository/index.js";
import { AuthService } from "./auth.service.js";

const context: RequestContext = {
  requestId: "test-google-request",
  ip: "127.0.0.1",
  userAgent: "vitest",
};

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    _id: new Types.ObjectId(),
    name: "Test Customer",
    email: "customer@onebitebakery.in",
    googleId: "google-12345",
    role: "customer",
    isVerified: true,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as User;

const createService = (
  userRepoOverrides: Partial<Record<keyof UserRepository, unknown>> = {},
) => {
  const userRepository = {
    findByGoogleId: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    createCustomerFromGoogle: vi
      .fn()
      .mockImplementation((payload) => Promise.resolve(createMockUser(payload))),
    linkGoogleAccount: vi
      .fn()
      .mockImplementation((userId, googleId, picture) =>
        Promise.resolve(createMockUser({ googleId, profileImage: picture })),
      ),
    markVerifiedLogin: vi.fn().mockResolvedValue(createMockUser()),
    findById: vi.fn().mockResolvedValue(createMockUser()),
    ...userRepoOverrides,
  } as unknown as UserRepository;

  const refreshTokenRepository = {
    createSession: vi.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  } as unknown as RefreshTokenRepository;

  return {
    service: new AuthService(
      userRepository,
      refreshTokenRepository,
    ),
    userRepository,
    refreshTokenRepository,
  };
};

describe("AuthService - Google Authentication", () => {
  it("generates valid Google OAuth consent URL", () => {
    const { service } = createService();
    const url = service.getGoogleAuthUrl();
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("response_type=code");
    expect(url).toContain("openid");
  });

  it("authenticates new user with Google identity", async () => {
    const { service, userRepository } = createService();

    const result = await service.authenticateWithGoogle(
      {
        token: "simulated-google-id-token",
        email: "new.customer@onebitebakery.in",
        name: "New Customer",
      },
      context,
    );

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("new.customer@onebitebakery.in");
    expect(result.tokens.accessToken).toBeDefined();
    expect(userRepository.createCustomerFromGoogle).toHaveBeenCalledOnce();
  });

  it("grants an admin role for platform admin Google email address (ajaykterha@gmail.com)", async () => {
    const { service, userRepository } = createService({
      createCustomerFromGoogle: vi.fn().mockImplementation((payload) =>
        Promise.resolve(createMockUser({ ...payload, role: payload.role || "customer" })),
      ),
    });

    const result = await service.authenticateWithGoogle(
      {
        token: "simulated-google-id-token",
        email: "ajaykterha@gmail.com",
        name: "Ajay Prajapati",
      },
      context,
    );

    expect(result.user.role).toBe("admin");
    expect(userRepository.createCustomerFromGoogle).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ajaykterha@gmail.com", role: "admin" }),
    );
  });

  it("assigns standard customer role for regular Google email address", async () => {
    const { service, userRepository } = createService({
      createCustomerFromGoogle: vi.fn().mockImplementation((payload) =>
        Promise.resolve(createMockUser({ ...payload, role: payload.role || "customer" })),
      ),
    });

    const result = await service.authenticateWithGoogle(
      {
        token: "simulated-google-id-token",
        email: "regular.shopper@gmail.com",
        name: "Regular Shopper",
      },
      context,
    );

    expect(result.user.role).toBe("customer");
    expect(userRepository.createCustomerFromGoogle).toHaveBeenCalledWith(
      expect.objectContaining({ email: "regular.shopper@gmail.com", role: "customer" }),
    );
  });

  it("safely links existing email customer with Google identity", async () => {
    const existingEmailUser = createMockUser({
      email: "existing@onebitebakery.in",
      googleId: undefined,
    });

    const { service, userRepository } = createService({
      findByGoogleId: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(existingEmailUser),
    });

    const result = await service.authenticateWithGoogle(
      {
        token: "simulated-google-id-token",
        email: "existing@onebitebakery.in",
      },
      context,
    );

    expect(result.user).toBeDefined();
    expect(userRepository.linkGoogleAccount).toHaveBeenCalledOnce();
  });

  it("logs in existing Google customer without re-creating account", async () => {
    const existingGoogleUser = createMockUser({
      googleId: "google-sub-existing",
    });

    const { service, userRepository } = createService({
      findByGoogleId: vi.fn().mockResolvedValue(existingGoogleUser),
    });

    const result = await service.authenticateWithGoogle(
      {
        token: "simulated-google-id-token",
        email: "existing@onebitebakery.in",
      },
      context,
    );

    expect(result.user).toBeDefined();
    expect(userRepository.createCustomerFromGoogle).not.toHaveBeenCalled();
    expect(userRepository.linkGoogleAccount).not.toHaveBeenCalled();
  });
});
