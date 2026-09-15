import { Types } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import type { User, UserRepository } from "../../user/index.js";
import type { RefreshTokenRepository } from "../repository/index.js";
import { AuthService } from "./auth.service.js";
import type { Msg91WidgetService } from "./msg91-widget.service.js";
import type { OtpService } from "./otp.service.js";

const context: RequestContext = {
  requestId: "test-phone-token-request",
  ip: "127.0.0.1",
  userAgent: "vitest-agent",
};

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    _id: new Types.ObjectId(),
    name: "The Online Bakery Customer",
    phone: "9876543210",
    role: "customer",
    isVerified: true,
    status: "active",
    authProviders: ["phone"],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as User;

const createService = (
  userRepoOverrides: Partial<Record<keyof UserRepository, unknown>> = {},
  msg91Overrides: Partial<Record<keyof Msg91WidgetService, unknown>> = {},
) => {
  const userRepository = {
    findByPhone: vi.fn().mockResolvedValue(null),
    createCustomerFromPhone: vi
      .fn()
      .mockImplementation((phone: string) =>
        Promise.resolve(createMockUser({ phone })),
      ),
    createAdminFromPhone: vi
      .fn()
      .mockImplementation((phone: string) =>
        Promise.resolve(createMockUser({ phone, role: "admin", email: "ajaykterha@gmail.com" })),
      ),
    markVerifiedLogin: vi.fn().mockImplementation((userId) =>
      Promise.resolve(createMockUser({ _id: userId })),
    ),
    findById: vi.fn().mockResolvedValue(createMockUser()),
    ...userRepoOverrides,
  } as unknown as UserRepository;

  const refreshTokenRepository = {
    createSession: vi.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
  } as unknown as RefreshTokenRepository;

  const msg91WidgetService = {
    verifyAccessToken: vi.fn().mockResolvedValue({ phone: "919876543210" }),
    ...msg91Overrides,
  } as unknown as Msg91WidgetService;

  const otpService = {} as OtpService;

  const service = new AuthService(
    otpService,
    userRepository,
    refreshTokenRepository,
    msg91WidgetService,
  );

  return {
    service,
    userRepository,
    refreshTokenRepository,
    msg91WidgetService,
  };
};

describe("AuthService - MSG91 Phone Access Token Authentication", () => {
  it("authenticates new customer and creates account from verified phone token", async () => {
    const { service, userRepository, refreshTokenRepository, msg91WidgetService } =
      createService();

    const result = await service.authenticateWithPhoneToken(
      { accessToken: "valid-msg91-access-token" },
      context,
    );

    expect(msg91WidgetService.verifyAccessToken).toHaveBeenCalledWith(
      "valid-msg91-access-token",
    );
    expect(userRepository.findByPhone).toHaveBeenCalledWith("9876543210");
    expect(userRepository.createCustomerFromPhone).toHaveBeenCalledWith("9876543210");
    expect(refreshTokenRepository.createSession).toHaveBeenCalledOnce();
    expect(result.user).toBeDefined();
    expect(result.user.phone).toBe("9876543210");
    expect(result.user.role).toBe("customer");
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it("authenticates existing customer without creating duplicate account", async () => {
    const existingCustomer = createMockUser({
      phone: "9876543210",
      name: "Existing Customer",
    });

    const { service, userRepository } = createService({
      findByPhone: vi.fn().mockResolvedValue(existingCustomer),
    });

    const result = await service.authenticateWithPhoneToken(
      { accessToken: "valid-msg91-access-token" },
      context,
    );

    expect(result.user).toBeDefined();
    expect(userRepository.createCustomerFromPhone).not.toHaveBeenCalled();
    expect(userRepository.markVerifiedLogin).toHaveBeenCalledWith(existingCustomer._id);
  });

  it("assigns admin role when verified phone belongs to configured admin", async () => {
    const { service, userRepository } = createService(
      {},
      {
        verifyAccessToken: vi.fn().mockResolvedValue({ phone: "917897671632" }),
      },
    );

    const result = await service.authenticateWithPhoneToken(
      { accessToken: "admin-access-token" },
      context,
    );

    expect(userRepository.createAdminFromPhone).toHaveBeenCalledWith("7897671632");
    expect(result.user.role).toBe("admin");
  });

  it("throws unauthorized error when MSG91 token verification fails", async () => {
    const { service } = createService(
      {},
      {
        verifyAccessToken: vi
          .fn()
          .mockRejectedValue(new AppError("Invalid or expired phone verification token.", 401)),
      },
    );

    await expect(
      service.authenticateWithPhoneToken(
        { accessToken: "invalid-token" },
        context,
      ),
    ).rejects.toThrow(AppError);
  });

  it("rejects authentication for blocked users", async () => {
    const blockedCustomer = createMockUser({
      phone: "9876543210",
      status: "blocked",
    });

    const { service } = createService({
      findByPhone: vi.fn().mockResolvedValue(blockedCustomer),
    });

    await expect(
      service.authenticateWithPhoneToken(
        { accessToken: "valid-msg91-token" },
        context,
      ),
    ).rejects.toThrow(AppError);
  });
});
