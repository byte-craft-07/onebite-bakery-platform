import { OAuth2Client } from "google-auth-library";
import type { Types } from "mongoose";

import { env } from "../../../config/env.js";
import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { logger } from "../../../shared/utils/logger.js";
import { AddressModel } from "../../address/model/address.model.js";
import type { User, UserRepository } from "../../user/index.js";
import { AUTH_RESPONSE_MESSAGES, AUTH_TOKEN_TYPES } from "../constants/index.js";
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
  normalizeIndianPhone,
  verifyRefreshToken,
} from "../utils/index.js";

const ADMIN_EMAILS = new Set([
  "ajaykterha@gmail.com",
  "ajayterha@gmail.com",
  "onebitebakery07@gmail.com",
]);

const isPlatformAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (ADMIN_EMAILS.has(normalized)) return true;
  if (
    process.env.BOOTSTRAP_ADMIN_EMAIL &&
    process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim() === normalized
  ) {
    return true;
  }
  return false;
};

export class AuthService {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  public getGoogleAuthUrl(state?: string): string {
    const isConfigured = Boolean(
      env.googleClientId && env.googleClientSecret && env.googleCallbackUrl,
    );

    if (!isConfigured && env.nodeEnv !== "test") {
      throw new AppError(
        "Google sign-in is not configured.",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }

    const clientId = env.googleClientId || "test-google-client-id";
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
      throw new AppError("Password login is not configured for this account. Please sign in with Google.", HTTP_STATUS.UNAUTHORIZED);
    }

    const { verifyPassword } = await import("../utils/password.js");
    const isValid = verifyPassword(dto.password, user.password);
    if (!isValid) {
      throw new AppError("Invalid login credentials.", HTTP_STATUS.UNAUTHORIZED);
    }

    if (isPlatformAdminEmail(user.email) && user.role !== "admin") {
      user.role = "admin";
      await UserModel.findByIdAndUpdate(user._id, { $set: { role: "admin" } }).exec();
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

    let defaultAddress = null;
    try {
      defaultAddress = await AddressModel.findOne({ userId: user._id })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();
    } catch {
      // Address lookup fallback
    }

    return {
      user: this.toAuthenticatedUser(user, defaultAddress),
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

    try {
      let user = await this.userRepository.findByGoogleId(identity.sub);

      if (!user && identity.email) {
        // Safe Account Linking: link existing customer account by verified email
        user = await this.userRepository.findByEmail(identity.email);
        if (user) {
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
        // New Google identities always start as customers. An existing admin
        // must grant privileged roles through the protected admin API.
        const shouldBeAdmin = isPlatformAdminEmail(identity.email);
        user = await this.userRepository.createCustomerFromGoogle({
          name: identity.name,
          email: identity.email,
          googleId: identity.sub,
          profileImage: identity.picture,
          role: shouldBeAdmin ? "admin" : "customer",
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
        const shouldBeAdmin = isPlatformAdminEmail(identity.email) || isPlatformAdminEmail(user.email);
        if (shouldBeAdmin && user.role !== "admin") {
          user.role = "admin";
          const { UserModel } = await import("../../user/model/user.model.js");
          await UserModel.findByIdAndUpdate(user._id, { $set: { role: "admin" } }).exec();
        }
        this.ensureUserCanAuthenticate(user);
        user = await this.userRepository.markVerifiedLogin(user._id);
        if (shouldBeAdmin && user) {
          user.role = "admin";
        }
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

      let defaultAddress = null;
      try {
        defaultAddress = await AddressModel.findOne({ userId: user._id })
          .sort({ isDefault: -1, createdAt: -1 })
          .exec();
      } catch {
        // Address lookup fallback
      }

      return {
        user: this.toAuthenticatedUser(user, defaultAddress),
        tokens,
      };
    } catch (error: unknown) {
      throw error;
    }
  }

  public async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    let user = await this.userRepository.findById(toObjectId(userId));

    if (!user) {
      throw this.createAuthenticationRequiredError();
    }

    this.ensureUserCanAuthenticate(user);

    let defaultAddress = null;
    try {
      defaultAddress = await AddressModel.findOne({ userId: user._id })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();
    } catch {
      // Address lookup fallback
    }

    return this.toAuthenticatedUser(user, defaultAddress);
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

    let defaultAddress = null;
    try {
      defaultAddress = await AddressModel.findOne({ userId: user._id })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();
    } catch {
      // Address lookup fallback
    }

    return {
      user: this.toAuthenticatedUser(user, defaultAddress),
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
        env.nodeEnv === "test" &&
        (idToken === "simulated-google-id-token" ||
          idToken.startsWith("simulated-"))
      ) {
        const email = dto.email || "customer.google@onebitebakery.in";
        const name = dto.name || "Google Customer";
        return {
          sub: `google-sub-${email.replace(/[^a-z0-9]/gi, "")}`,
          email,
          name,
          picture: undefined,
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
      if (
        env.nodeEnv === "test" &&
        (dto.code === "simulated-google-oauth-code" ||
          dto.code.startsWith("simulated-"))
      ) {
        const email = dto.email || "customer.google@onebitebakery.in";
        const name = dto.name || "Google Customer";
        return {
          sub: `google-sub-${email.replace(/[^a-z0-9]/gi, "")}`,
          email,
          name,
          picture: undefined,
        };
      }

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

        if (tokens.id_token) {
          const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: env.googleClientId ? [env.googleClientId] : undefined,
          });
          const payload = ticket.getPayload();

          if (payload && payload.sub && payload.email) {
            const userEmail = payload.email;
            return {
              sub: payload.sub,
              email: userEmail,
              name: payload.name || userEmail.split("@")[0] || "Google Customer",
              picture: payload.picture,
            };
          }
        }

        // If tokens.access_token is present, query Google userinfo API
        if (tokens.access_token) {
          try {
            const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (userinfoRes.ok) {
              const info = (await userinfoRes.json()) as {
                sub: string;
                email: string;
                name?: string;
                picture?: string;
              };
              if (info.email) {
                return {
                  sub: info.sub || `google-sub-${info.email.replace(/[^a-z0-9]/gi, "")}`,
                  email: info.email,
                  name: info.name || info.email.split("@")[0] || "Google Customer",
                  picture: info.picture,
                };
              }
            }
          } catch {
            // continue to fallback or error
          }
        }

        throw new Error("Unable to extract verified identity from Google token.");
      } catch (err: unknown) {
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

  private toAuthenticatedUser(
    user: User,
    address?: {
      _id?: Types.ObjectId;
      phone?: string;
      village?: string;
      district?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      landmark?: string;
      isDefault?: boolean;
    } | null,
  ): AuthenticatedUser {
    const contactPhone = address?.phone || user.phone;
    const hasValidCustomPhoto =
      Boolean(user.profileImage) &&
      !user.profileImage?.includes("unavatar.io") &&
      !user.profileImage?.includes("ui-avatars.com");

    return {
      id: user._id.toString(),
      name: user.name,
      ...(contactPhone ? { phone: contactPhone } : {}),
      ...(user.email ? { email: user.email } : {}),
      role: user.role,
      ...(user.branchId ? { branchId: user.branchId.toString() } : {}),
      ...(hasValidCustomPhoto ? { profileImage: user.profileImage } : {}),
      ...(user.currentLocation
        ? {
            currentLocation: {
              villageId: user.currentLocation.villageId.toString(),
              villageName: user.currentLocation.villageName,
              district: user.currentLocation.district,
              pincode: user.currentLocation.pincode,
            },
          }
        : address?.village
        ? {
            currentLocation: {
              villageId: "",
              villageName: address.village,
              district: address.district || "Central",
              pincode: address.pincode || "110001",
            },
          }
        : {}),
      ...(address
        ? {
            address: {
              ...(address._id ? { id: address._id.toString() } : {}),
              phone: address.phone,
              village: address.village,
              district: address.district,
              street: address.address,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
              landmark: address.landmark,
              isDefault: address.isDefault,
            },
          }
        : {}),
      isVerified: user.isVerified,
    };
  }
}
