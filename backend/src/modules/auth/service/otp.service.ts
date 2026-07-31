import { env } from "../../../config/env.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { logger } from "../../../shared/utils/logger.js";
import {
  OTP_CONSTANTS,
  OTP_RESPONSE_MESSAGES,
} from "../constants/otp.constants.js";
import type { SendOtpDto, VerifyOtpDto } from "../dto/index.js";
import type { OtpRepository } from "../repository/index.js";
import type {
  OtpProvider,
  SendOtpResult,
  VerifyOtpResult,
} from "../types/index.js";
import {
  compareOtpHash,
  createOtpExpiry,
  createOtpHash,
  generateOtp,
  isOtpCooldownActive,
  maskPhone,
} from "../utils/index.js";

export class OtpService {
  public constructor(
    private readonly otpRepository: OtpRepository,
    private readonly otpProvider: OtpProvider,
  ) {}

  public async sendOtp(
    dto: SendOtpDto,
    context: RequestContext,
  ): Promise<SendOtpResult> {
    const now = new Date();
    const existingChallenge =
      await this.otpRepository.findLatestActiveChallenge(
        dto.phone,
        dto.purpose,
        now,
      );

    if (
      existingChallenge &&
      isOtpCooldownActive(existingChallenge.lastSentAt, now)
    ) {
      logger.warn(
        {
          phone: maskPhone(dto.phone),
          purpose: dto.purpose,
          requestId: context.requestId,
        },
        "OTP request rejected by cooldown",
      );

      throw new AppError(
        OTP_RESPONSE_MESSAGES.COOLDOWN_ACTIVE,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        [],
        true,
        APP_ERROR_CODES.OTP_COOLDOWN_ACTIVE,
      );
    }

    if (
      existingChallenge &&
      existingChallenge.resendCount >= OTP_CONSTANTS.MAX_RESENDS
    ) {
      logger.warn(
        {
          phone: maskPhone(dto.phone),
          purpose: dto.purpose,
          requestId: context.requestId,
        },
        "OTP request rejected by resend limit",
      );

      throw new AppError(
        OTP_RESPONSE_MESSAGES.RESEND_LIMIT_REACHED,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        [],
        true,
        APP_ERROR_CODES.OTP_RESEND_LIMIT_REACHED,
      );
    }

    const otp = generateOtp();
    const otpHash = createOtpHash(otp);
    const expiresAt = createOtpExpiry(now);

    const challenge = existingChallenge
      ? await this.otpRepository.refreshChallenge(existingChallenge._id, {
          otpHash,
          expiresAt,
          lastSentAt: now,
          ipAddress: context.ip,
          userAgent: context.userAgent,
        })
      : await this.otpRepository.createChallenge({
          phone: dto.phone,
          purpose: dto.purpose,
          otpHash,
          expiresAt,
          lastSentAt: now,
          ipAddress: context.ip,
          userAgent: context.userAgent,
        });

    if (!challenge) {
      throw new AppError("Unable to create OTP challenge.");
    }

    await this.otpProvider.sendOtp({
      phone: dto.phone,
      purpose: dto.purpose,
      otp,
      expiresAt,
    });

    logger.info(
      {
        phone: maskPhone(dto.phone),
        purpose: dto.purpose,
        requestId: context.requestId,
      },
      "OTP request accepted",
    );

    return {
      expiresInSeconds: OTP_CONSTANTS.EXPIRY_MINUTES * 60,
      cooldownSeconds: OTP_CONSTANTS.COOLDOWN_SECONDS,
    };
  }

  public async verifyOtp(
    dto: VerifyOtpDto,
    context: RequestContext,
  ): Promise<VerifyOtpResult> {
    // Development OTP Bypass (Only active for dev admin phone 9999999999 with code 123456 when nodeEnv !== "production")
    if (
      env.nodeEnv !== "production" &&
      dto.phone === "9999999999" &&
      dto.otp === "123456"
    ) {
      logger.info(
        {
          phone: maskPhone(dto.phone),
          purpose: dto.purpose,
          requestId: context.requestId,
        },
        "Development OTP bypass accepted for admin login",
      );
      return { verified: true };
    }

    const challenge = await this.otpRepository.findLatestActiveChallenge(
      dto.phone,
      dto.purpose,
    );

    if (!challenge) {
      this.logOtpFailure(dto, context, "No active OTP challenge found");
      throw this.createInvalidOtpError();
    }

    if (challenge.attempts >= OTP_CONSTANTS.MAX_ATTEMPTS) {
      this.logOtpFailure(dto, context, "OTP attempt limit exceeded");
      throw new AppError(
        OTP_RESPONSE_MESSAGES.ATTEMPTS_EXCEEDED,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        [],
        true,
        APP_ERROR_CODES.OTP_ATTEMPTS_EXCEEDED,
      );
    }

    const isMatch = compareOtpHash(dto.otp, challenge.otpHash);

    if (!isMatch) {
      await this.otpRepository.incrementAttempts(challenge._id);
      this.logOtpFailure(dto, context, "OTP verification failed");
      throw this.createInvalidOtpError();
    }

    await this.otpRepository.markUsed(challenge._id);

    logger.info(
      {
        phone: maskPhone(dto.phone),
        purpose: dto.purpose,
        requestId: context.requestId,
      },
      "OTP verification succeeded",
    );

    return { verified: true };
  }

  private createInvalidOtpError(): AppError {
    return new AppError(
      OTP_RESPONSE_MESSAGES.INVALID_OR_EXPIRED,
      HTTP_STATUS.BAD_REQUEST,
      [],
      true,
      APP_ERROR_CODES.OTP_INVALID_OR_EXPIRED,
    );
  }

  private logOtpFailure(
    dto: VerifyOtpDto,
    context: RequestContext,
    reason: string,
  ): void {
    logger.warn(
      {
        phone: maskPhone(dto.phone),
        purpose: dto.purpose,
        requestId: context.requestId,
      },
      reason,
    );
  }
}
