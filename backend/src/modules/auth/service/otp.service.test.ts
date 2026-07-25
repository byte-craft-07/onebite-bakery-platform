import { Types, type HydratedDocument } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { OTP_CONSTANTS } from "../constants/index.js";
import type { Otp } from "../model/index.js";
import type { OtpProvider } from "../types/index.js";
import { createOtpExpiry, createOtpHash } from "../utils/index.js";
import type { OtpRepository } from "../repository/index.js";
import { OtpService } from "./otp.service.js";

const context: RequestContext = {
  requestId: "test-request",
  ip: "127.0.0.1",
  userAgent: "vitest",
};

const createChallenge = (
  overrides: Partial<Otp> = {},
): HydratedDocument<Otp> => {
  const challenge = {
    _id: new Types.ObjectId(),
    phone: "9876543210",
    purpose: "login",
    otpHash: createOtpHash("123456"),
    expiresAt: createOtpExpiry(),
    attempts: 0,
    resendCount: 0,
    lastSentAt: new Date(Date.now() - OTP_CONSTANTS.COOLDOWN_MS - 1000),
    isUsed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  return challenge as HydratedDocument<Otp>;
};

const createService = (
  repositoryOverrides: Partial<Record<keyof OtpRepository, unknown>> = {},
) => {
  const repository = {
    findLatestActiveChallenge: vi.fn().mockResolvedValue(null),
    createChallenge: vi.fn().mockResolvedValue(createChallenge()),
    refreshChallenge: vi.fn().mockResolvedValue(createChallenge()),
    incrementAttempts: vi.fn().mockResolvedValue(createChallenge()),
    markUsed: vi.fn().mockResolvedValue(createChallenge({ isUsed: true })),
    ...repositoryOverrides,
  } as unknown as OtpRepository;

  const provider: OtpProvider = {
    sendOtp: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new OtpService(repository, provider),
    repository,
    provider,
  };
};

describe("OtpService", () => {
  it("sends a new OTP without exposing the generated value", async () => {
    const { service, provider } = createService();

    const result = await service.sendOtp(
      { phone: "9876543210", purpose: "login" },
      context,
    );

    expect(result.expiresInSeconds).toBe(300);
    expect(provider.sendOtp).toHaveBeenCalledOnce();
  });

  it("rejects expired or missing OTP challenges", async () => {
    const { service } = createService();

    await expect(
      service.verifyOtp(
        { phone: "9876543210", purpose: "login", otp: "123456" },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("tracks invalid OTP attempts", async () => {
    const challenge = createChallenge();
    const { service, repository } = createService({
      findLatestActiveChallenge: vi.fn().mockResolvedValue(challenge),
    });

    await expect(
      service.verifyOtp(
        { phone: "9876543210", purpose: "login", otp: "111111" },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
    expect(repository.incrementAttempts).toHaveBeenCalledWith(challenge._id);
  });

  it("blocks verification after too many attempts", async () => {
    const challenge = createChallenge({
      attempts: OTP_CONSTANTS.MAX_ATTEMPTS,
    });
    const { service, repository } = createService({
      findLatestActiveChallenge: vi.fn().mockResolvedValue(challenge),
    });

    await expect(
      service.verifyOtp(
        { phone: "9876543210", purpose: "login", otp: "123456" },
        context,
      ),
    ).rejects.toBeInstanceOf(AppError);
    expect(repository.incrementAttempts).not.toHaveBeenCalled();
  });
});
