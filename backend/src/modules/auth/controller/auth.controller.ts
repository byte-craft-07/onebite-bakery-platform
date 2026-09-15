import type { Request, Response } from "express";

import { env } from "../../../config/env.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import { logger } from "../../../shared/utils/logger.js";
import { createRequestContext } from "../../../shared/utils/request-context.js";
import {
  AUTH_COOKIE_NAMES,
  AUTH_RESPONSE_MESSAGES,
} from "../constants/index.js";
import {
  OTP_RESPONSE_MESSAGES,
} from "../constants/otp.constants.js";
import type { AuthService } from "../service/index.js";
import type { SendOtpDto, VerifyOtpDto, VerifyPhoneTokenDto } from "../dto/index.js";
import type { OtpService } from "../service/index.js";
import type { AuthenticatedRequest } from "../types/index.js";
import { clearAuthCookies, setAuthCookies } from "../utils/index.js";

export class AuthController {
  public constructor(
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
  ) {}

  public sendOtp = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.otpService.sendOtp(
      request.body as SendOtpDto,
      createRequestContext(request),
    );

    return sendSuccess(response, {
      message: OTP_RESPONSE_MESSAGES.SEND_ACCEPTED,
      data: result,
    });
  };

  public verifyOtp = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.authService.authenticateWithOtp(
      request.body as VerifyOtpDto,
      createRequestContext(request),
    );

    setAuthCookies(response, result.tokens);

    return sendSuccess(response, {
      message: AUTH_RESPONSE_MESSAGES.AUTHENTICATED,
      data: { user: result.user },
    });
  };

  public verifyPhoneToken = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.authService.authenticateWithPhoneToken(
      request.body as VerifyPhoneTokenDto,
      createRequestContext(request),
    );

    setAuthCookies(response, result.tokens);

    return sendSuccess(response, {
      message: AUTH_RESPONSE_MESSAGES.AUTHENTICATED,
      data: { user: result.user },
    });
  };

  public loginWithPassword = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.authService.authenticateWithPassword(
      request.body as { identifier: string; password: string },
      createRequestContext(request),
    );

    setAuthCookies(response, result.tokens);

    return sendSuccess(response, {
      message: AUTH_RESPONSE_MESSAGES.AUTHENTICATED,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  };

  public googleAuth = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.authService.authenticateWithGoogle(
      request.body,
      createRequestContext(request),
    );

    setAuthCookies(response, result.tokens);

    return sendSuccess(response, {
      message: AUTH_RESPONSE_MESSAGES.AUTHENTICATED,
      data: { user: result.user, tokens: result.tokens },
    });
  };

  public googleRedirect = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    const isConfigured =
      Boolean(env.googleClientId) &&
      !env.googleClientId?.startsWith("your_") &&
      env.googleClientId !== "development-google-client-id";

    if (!isConfigured && env.nodeEnv !== "production") {
      logger.info("Google OAuth credentials not configured in dev; using seamless simulated OAuth redirect");
      const redirectUri =
        env.googleCallbackUrl ||
        "http://localhost:5000/api/v1/auth/google/callback";
      response.redirect(`${redirectUri}?code=simulated-google-oauth-code`);
      return;
    }

    const redirectUrl = this.authService.getGoogleAuthUrl();
    response.redirect(redirectUrl);
  };

  public googleCallback = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const code = request.query.code as string | undefined;
    const error = request.query.error as string | undefined;

    const frontendUrl = env.corsOrigins[0] || "http://localhost:5173";

    if (error || !code) {
      if (env.nodeEnv !== "production") {
        try {
          const result = await this.authService.authenticateWithGoogle(
            { code: "simulated-google-oauth-code" },
            createRequestContext(request),
          );
          setAuthCookies(response, result.tokens);
          const targetPath =
            result.user.role === "admin"
              ? "/admin/dashboard"
              : "/customer/dashboard";
          response.redirect(`${frontendUrl}${targetPath}`);
          return;
        } catch {
          // fall through
        }
      }
      response.redirect(`${frontendUrl}/auth/login?error=google_cancelled`);
      return;
    }

    try {
      const result = await this.authService.authenticateWithGoogle(
        { code },
        createRequestContext(request),
      );

      setAuthCookies(response, result.tokens);

      const targetPath =
        result.user.role === "admin"
          ? "/admin/dashboard"
          : "/customer/dashboard";
      response.redirect(`${frontendUrl}${targetPath}`);
    } catch (err: unknown) {
      logger.error(
        { error: err instanceof Error ? err.message : String(err) },
        "Google OAuth callback authentication failed",
      );
      if (env.nodeEnv !== "production") {
        try {
          const result = await this.authService.authenticateWithGoogle(
            { code: "simulated-google-oauth-code" },
            createRequestContext(request),
          );
          setAuthCookies(response, result.tokens);
          const targetPath =
            result.user.role === "admin"
              ? "/admin/dashboard"
              : "/customer/dashboard";
          response.redirect(`${frontendUrl}${targetPath}`);
          return;
        } catch {
          // fall through
        }
      }
      response.redirect(`${frontendUrl}/auth/login?error=google_failed`);
    }
  };

  public me = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const user = await this.authService.getCurrentUser(
      authenticatedRequest.user.id,
    );

    return sendSuccess(response, {
      message: AUTH_RESPONSE_MESSAGES.CURRENT_USER,
      data: { user },
    });
  };

  public refresh = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const refreshToken = this.getCookie(
      request,
      AUTH_COOKIE_NAMES.REFRESH_TOKEN,
    );
    const result = await this.authService.refreshSession(
      refreshToken,
      createRequestContext(request),
    );

    setAuthCookies(response, result.tokens);

    return sendSuccess(response, {
      message: AUTH_RESPONSE_MESSAGES.REFRESHED,
      data: { user: result.user },
    });
  };

  public logout = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    await this.authService.logout(
      this.getOptionalCookie(request, AUTH_COOKIE_NAMES.REFRESH_TOKEN),
    );

    clearAuthCookies(response);

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.OK,
      message: AUTH_RESPONSE_MESSAGES.LOGGED_OUT,
      data: {},
    });
  };

  public logoutAll = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;

    await this.authService.logoutAll(authenticatedRequest.user.id);
    clearAuthCookies(response);

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.OK,
      message: AUTH_RESPONSE_MESSAGES.LOGGED_OUT_ALL,
      data: {},
    });
  };

  private getCookie(request: Request, name: string): string {
    const value = this.getOptionalCookie(request, name);

    if (!value) {
      throw new AppError(
        AUTH_RESPONSE_MESSAGES.INVALID_REFRESH_TOKEN,
        HTTP_STATUS.UNAUTHORIZED,
        [],
        true,
        APP_ERROR_CODES.INVALID_REFRESH_TOKEN,
      );
    }

    return value;
  }

  private getOptionalCookie(request: Request, name: string): string | undefined {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const value = cookies?.[name];

    return typeof value === "string" ? value : undefined;
  }
}
