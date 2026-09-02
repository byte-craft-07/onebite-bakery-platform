import { OAuth2Client } from "google-auth-library";
import type { Types } from "mongoose";

import { env } from "../../../config/env.js";
import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { logger } from "../../../shared/utils/logger.js";
import type { User, UserRepository } from "../../user/index.js";
import { AUTH_RESPONSE_MESSAGES, AUTH_TOKEN_TYPES } from "../constants/index.js";
import type { VerifyOtpDto } from "../dto/index.js";
import type { RefreshTokenRepository } from "../repository/index.js";
import type {
  AuthenticatedUser,
  AuthenticationResult,
  AuthTokens,
} from "../types/index.js";
import {
  createRefreshTokenHash,
  generateAuthTokens,
  generateDeviceId,
  maskPhone,
  normalizeIndianPhone,
  verifyRefreshToken,
} from "../utils/index.js";
import type { OtpService } from "./index.js";

export const ADMIN_EMAILS = [
  "theonlinebakery07@gmail.com",
];

export const ADMIN_PHONES = [
  "7897671632",
  "9999999999",
];

export const isConfiguredAdmin = (email?: string, phone?: string): boolean => {
  const normEmail = email?.trim().toLowerCase();
  const normPhone = phone ? normalizeIndianPhone(phone) : undefined;
  if (normEmail && ADMIN_EMAILS.includes(normEmail)) return true;
  if (normPhone && ADMIN_PHONES.includes(normPhone)) return true;
  return false;
};

export class AuthService {
  public constructor(
    private readonly otpService: OtpService,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  public getGoogleAuthUrl(state?: string): string {
    const clientId = env.googleClientId || "development-google-client-id";
    const redirectUri =
      env.googleCallbackUrl ||
      "http://localhost:5000/api/v1/auth/google/callback";

    const client = new OAuth2Client(
      clientId,
      env.googleClientSecret,
      redirectUri,
    );

    return client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
      ...(state ? { state } : {}),
    });
  }

  public async authenticateWithOtp(
    dto: VerifyOtpDto,
    context: RequestContext,
  ): Promise<AuthenticationResult> {
    await this.otpService.verifyOtp(dto, context);

    const normalizedPhone = normalizeIndianPhone(dto.phone);
    let user = await this.userRepository.findByPhone(normalizedPhone);

    const isAdminUser = isConfiguredAdmin(user?.email, normalizedPhone);

    if (!user) {
      if (isAdminUser) {
        user = await this.userRepository.createAdminFromPhone(normalizedPhone);
      } else {
        user =
          await this.userRepository.createCustomerFromPhone(normalizedPhone);
      }
    } else {
      if (isAdminUser && user.role !== "admin") {
        user.role = "admin";
        await user.save();
      }
      this.ensureUserCanAuthenticate(user);
      user = await this.userRepository.markVerifiedLogin(user._id);
    }

    if (!user) {
      throw new AppError("Unable to authenticate user.");
    }

    this.ensureUserCanAuthenticate(user);

    const deviceId = generateDeviceId();
    const tokens = generateAuthTokens({
      userId: user._id.toString(),
      role: user.role,
      branchId: user.branchId?.toString(),
      deviceId,
    });

    await this.createRefreshSession(user._id, deviceId, tokens, context);

    logger.info(
      {
        userId: user._id.toString(),
        phone: maskPhone(normalizedPhone),
        requestId: context.requestId,
      },
      "User authenticated with OTP",
    );

    return {
      user: this.toAuthenticatedUser(user),
      tokens,
    };
  }

  public async authenticateWithPassword(
    dto: { identifier: string; password: string },
    context: RequestContext,
  ): Promise<AuthenticationResult> {
    const rawIdentifier = dto.identifier.trim();
    let query: Record<string, unknown> = {};

    if (rawIdentifier.includes("@")) {
      query = { email: rawIdentifier.toLowerCase() };
    } else {
      const normalizedPhone = normalizeIndianPhone(rawIdentifier);
      query = { phone: normalizedPhone };
    }

    const { UserModel } = await import("../../user/model/user.model.js");
    const user = await UserModel.findOne(query).select("+password").exec();

    if (!user || user.status !== "active") {
      throw new AppError("Invalid login credentials or account is inactive.", HTTP_STATUS.UNAUTHORIZED);
    }

    if (!user.password) {
      throw new AppError("Password login is not configured for this account. Please log in with Phone OTP.", HTTP_STATUS.UNAUTHORIZED);
    }

    const { verifyPassword } = await import("../utils/password.js");
    const isValid = verifyPassword(dto.password, user.password);
    if (!isValid) {
      throw new AppError("Invalid login credentials.", HTTP_STATUS.UNAUTHORIZED);
    }

    this.ensureUserCanAuthenticate(user);

    const deviceId = generateDeviceId();
    const tokens = generateAuthTokens({
      userId: user._id.toString(),
      role: user.role,
      branchId: user.branchId?.toString(),
      deviceId,
    });

    await this.createRefreshSession(user._id, deviceId, tokens, context);

    logger.info(
      {
        userId: user._id.toString(),
        role: user.role,
        requestId: context.requestId,
      },
      "User authenticated with Password",
    );

    return {
      user: this.toAuthenticatedUser(user),
      tokens,
    };
  }

  public async authenticateWithGoogle(
    dto: {
      token?: string;
      credential?: string;
      code?: string;
      name?: string;
      email?: string;
      role?: string;
    },
    context: RequestContext,
  ): Promise<AuthenticationResult> {
    const identity = await this.verifyGoogleIdentity(dto);
    const isAdminUser = isConfiguredAdmin(identity.email);

    let user = await this.userRepository.findByGoogleId(identity.sub);

    if (!user && identity.email) {
      // Safe Account Linking: link existing customer account by verified email
      user = await this.userRepository.findByEmail(identity.email);
      if (user) {
        if (isAdminUser && user.role !== "admin") {
          user.role = "admin";
          await user.save();
        }
        user = await this.userRepository.linkGoogleAccount(
          user._id,
          identity.sub,
          identity.picture,
        );

        logger.info(
          {
            userId: user?._id.toString(),
            email: identity.email,
            requestId: context.requestId,
          },
          "Linked existing customer account with Google identity",
        );
      }
    }

    if (!user) {
      // Create new account with verified Google identity
      user = await this.userRepository.create({
        name: identity.name,
        email: identity.email.toLowerCase(),
        googleId: identity.sub,
        profileImage: identity.picture,
        authProviders: ["google"],
        role: isAdminUser ? "admin" : "customer",
        isVerified: true,
        status: "active",
        lastLogin: new Date(),
      });

      logger.info(
        {
          userId: user._id.toString(),
          email: identity.email,
          role: user.role,
          requestId: context.requestId,
        },
        "New user registered via Google",
      );
    } else {
      if (isAdminUser && user.role !== "admin") {
        user.role = "admin";
        await user.save();
      }
      this.ensureUserCanAuthenticate(user);
      user = await this.userRepository.markVerifiedLogin(user._id);
    }

    if (!user) {
      throw new AppError("Unable to authenticate Google user.");
    }

    this.ensureUserCanAuthenticate(user);

    const deviceId = generateDeviceId();
    const tokens = generateAuthTokens({
      userId: user._id.toString(),
      role: user.role,
      branchId: user.branchId?.toString(),
      deviceId,
    });

    await this.createRefreshSession(user._id, deviceId, tokens, context);

    return {
      user: this.toAuthenticatedUser(user),
      tokens,
    };
  }

  public async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    let user = await this.userRepository.findById(toObjectId(userId));

    if (!user) {
      throw this.createAuthenticationRequiredError();
    }

    if (isConfiguredAdmin(user.email, user.phone) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    this.ensureUserCanAuthenticate(user);

    return this.toAuthenticatedUser(user);
  }

  public async refreshSession(
    refreshToken: string,
    context: RequestContext,
  ): Promise<AuthenticationResult> {
    const payload = verifyRefreshToken(refreshToken);

    if (payload.type !== AUTH_TOKEN_TYPES.REFRESH || !payload.deviceId) {
      throw this.createInvalidRefreshTokenError();
    }

    const tokenHash = createRefreshTokenHash(refreshToken);
    const activeSession =
      await this.refreshTokenRepository.findActiveByHash(tokenHash);

    if (!activeSession) {
      throw this.createInvalidRefreshTokenError();
    }

    let user = await this.userRepository.findById(toObjectId(payload.sub));

    if (!user) {
      throw this.createInvalidRefreshTokenError();
    }

    if (isConfiguredAdmin(user.email, user.phone) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    this.ensureUserCanAuthenticate(user);

    const tokens = generateAuthTokens({
      userId: user._id.toString(),
      role: user.role,
      branchId: user.branchId?.toString(),
      deviceId: payload.deviceId,
    });

    const newSession = await this.createRefreshSession(
      user._id,
      payload.deviceId,
      tokens,
      context,
    );

    await this.refreshTokenRepository.rotateSession(
      activeSession._id,
      newSession._id,
    );

    logger.info(
      {
        userId: user._id.toString(),
        deviceId: payload.deviceId,
        requestId: context.requestId,
      },
      "Refresh token rotated",
    );

    return {
      user: this.toAuthenticatedUser(user),
      tokens,
    };
  }

  public async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      verifyRefreshToken(refreshToken);
      const tokenHash = createRefreshTokenHash(refreshToken);
      const activeSession =
        await this.refreshTokenRepository.findActiveByHash(tokenHash);

      if (activeSession) {
        await this.refreshTokenRepository.revokeSession(activeSession._id);
      }
    } catch {
      return;
    }
  }

  public async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(toObjectId(userId));
  }

  private async verifyGoogleIdentity(dto: {
    token?: string;
    credential?: string;
    code?: string;
    email?: string;
    name?: string;
  }): Promise<{ sub: string; email: string; name: string; picture?: string }> {
    const idToken = dto.credential || dto.token;

    // ID Token verification via Google OAuth2Client
    if (idToken) {
      if (
        env.nodeEnv !== "production" &&
        (idToken === "simulated-google-id-token" ||
          idToken.startsWith("simulated-"))
      ) {
        const email = dto.email || "customer.google@theonlinebakery.in";
        return {
          sub: `google-sub-${email.replace(/[^a-z0-9]/gi, "")}`,
          email,
          name: dto.name || "Google Customer",
          picture:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        };
      }

      try {
        const client = new OAuth2Client(env.googleClientId);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: env.googleClientId ? [env.googleClientId] : undefined,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.sub || !payload.email) {
          throw new AppError(
            "Invalid Google ID token payload.",
            HTTP_STATUS.UNAUTHORIZED,
          );
        }

        const userEmail = payload.email;

        return {
          sub: payload.sub,
          email: userEmail,
          name: payload.name || userEmail.split("@")[0] || "Google Customer",
          picture: payload.picture,
        };
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        logger.error(
          { error: err instanceof Error ? err.message : String(err) },
          "Google ID Token verification failed",
        );
        throw new AppError(
          "Google token verification failed.",
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
    }

    // Authorization Code exchange via Google OAuth2Client
    if (dto.code) {
      try {
        const redirectUri =
          env.googleCallbackUrl ||
          "http://localhost:5000/api/v1/auth/google/callback";
        const client = new OAuth2Client(
          env.googleClientId,
          env.googleClientSecret,
          redirectUri,
        );
        const { tokens } = await client.getToken(dto.code);

        if (!tokens.id_token) {
          throw new AppError(
            "Failed to receive Google ID token.",
            HTTP_STATUS.UNAUTHORIZED,
          );
        }

        const ticket = await client.verifyIdToken({
          idToken: tokens.id_token,
          audience: env.googleClientId ? [env.googleClientId] : undefined,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.sub || !payload.email) {
          throw new AppError(
            "Invalid Google token payload.",
            HTTP_STATUS.UNAUTHORIZED,
          );
        }

        const userEmail = payload.email;

        return {
          sub: payload.sub,
          email: userEmail,
          name: payload.name || userEmail.split("@")[0] || "Google Customer",
          picture: payload.picture,
        };
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        logger.error(
          { error: err instanceof Error ? err.message : String(err) },
          "Google Auth Code exchange failed",
        );
        throw new AppError(
          "Google authentication code exchange failed.",
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
    }

    // Non-production fallback when credentials are not configured yet
    if (env.nodeEnv !== "production") {
      const email = dto.email || "customer.google@theonlinebakery.in";
      return {
        sub: `google-sub-${email.replace(/[^a-z0-9]/gi, "")}`,
        email,
        name: dto.name || "Google Customer",
      };
    }

    throw new AppError(
      "Google credential, token, or code is required.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  private async createRefreshSession(
    userId: Types.ObjectId,
    deviceId: string,
    tokens: AuthTokens,
    context: RequestContext,
  ) {
    const now = new Date();

    return this.refreshTokenRepository.createSession({
      userId,
      tokenHash: createRefreshTokenHash(tokens.refreshToken),
      deviceId,
      expiresAt: new Date(now.getTime() + tokens.refreshTokenMaxAgeMs),
      ipAddress: context.ip,
      userAgent: context.userAgent,
      lastUsedAt: now,
    });
  }

  private ensureUserCanAuthenticate(user: User): void {
    if (user.status === "blocked") {
      throw new AppError(
        AUTH_RESPONSE_MESSAGES.USER_BLOCKED,
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.USER_BLOCKED,
      );
    }
  }

  private createAuthenticationRequiredError(): AppError {
    return new AppError(
      AUTH_RESPONSE_MESSAGES.AUTHENTICATION_REQUIRED,
      HTTP_STATUS.UNAUTHORIZED,
      [],
      true,
      APP_ERROR_CODES.AUTHENTICATION_REQUIRED,
    );
  }

  private createInvalidRefreshTokenError(): AppError {
    return new AppError(
      AUTH_RESPONSE_MESSAGES.INVALID_REFRESH_TOKEN,
      HTTP_STATUS.UNAUTHORIZED,
      [],
      true,
      APP_ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user._id.toString(),
      name: user.name,
      ...(user.phone ? { phone: user.phone } : {}),
      ...(user.email ? { email: user.email } : {}),
      role: user.role,
      ...(user.branchId ? { branchId: user.branchId.toString() } : {}),
      ...(user.profileImage ? { profileImage: user.profileImage } : {}),
      ...(user.currentLocation
        ? {
            currentLocation: {
              villageId: user.currentLocation.villageId.toString(),
              villageName: user.currentLocation.villageName,
              district: user.currentLocation.district,
              pincode: user.currentLocation.pincode,
            },
          }
        : {}),
      isVerified: user.isVerified,
    };
  }
}
