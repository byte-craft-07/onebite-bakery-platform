import type { Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";

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
import type { AuthService } from "../service/index.js";
import type { AuthenticatedRequest } from "../types/index.js";
import {
  clearAuthCookies,
  clearGoogleOAuthStateCookie,
  setAuthCookies,
  setGoogleOAuthStateCookie,
} from "../utils/index.js";

export class AuthController {
  public constructor(
    private readonly authService: AuthService,
  ) {}

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
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  };

  public googleRedirect = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const rawNonce = randomBytes(32).toString("base64url");
    const requestedOrigin = request.query?.origin as string | undefined;
    const requestedRedirect = request.query?.redirect as string | undefined;

    let matchedOrigin: string | undefined;
    if (requestedOrigin) {
      const match = env.corsOrigins.find(
        (o) => o.toLowerCase() === requestedOrigin.toLowerCase(),
      );
      if (match) {
        matchedOrigin = match;
      }
    }

    let stateString = rawNonce;
    if (matchedOrigin || requestedRedirect) {
      try {
        stateString = Buffer.from(
          JSON.stringify({
            nonce: rawNonce,
            origin: matchedOrigin,
            redirect: requestedRedirect,
          }),
        ).toString("base64url");
      } catch {
        stateString = rawNonce;
      }
    }

    const redirectUrl = this.authService.getGoogleAuthUrl(stateString);
    setGoogleOAuthStateCookie(response, rawNonce);
    response.redirect(redirectUrl);
  };

  public googleCallback = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const code = request.query.code as string | undefined;
    const error = request.query.error as string | undefined;
    const state = request.query.state;
    const expectedState = this.getOptionalCookie(
      request,
      AUTH_COOKIE_NAMES.GOOGLE_OAUTH_STATE,
    );

    const parsedState = this.parseState(state);
    const frontendUrl =
      parsedState.origin || env.corsOrigins[0] || "http://localhost:5173";
    clearGoogleOAuthStateCookie(response);

    if (!this.isValidGoogleOAuthState(state, expectedState)) {
      response.redirect(`${frontendUrl}/auth/login?error=google_invalid_state`);
      return;
    }

    if (error || !code) {
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
        parsedState.redirect ||
        (result.user.role === "admin"
          ? "/admin/dashboard"
          : result.user.role === "branch_admin"
          ? "/admin/branch/dashboard"
          : result.user.role === "delivery_agent"
          ? "/agent/dashboard"
          : "/customer/dashboard");

      const callbackUrl = new URL(`${frontendUrl}/auth/callback`);
      callbackUrl.searchParams.set("token", result.tokens.accessToken);
      callbackUrl.searchParams.set("refreshToken", result.tokens.refreshToken);
      callbackUrl.searchParams.set("redirect", targetPath);

      response.redirect(callbackUrl.toString());
    } catch (err: unknown) {
      logger.error(
        { error: err instanceof Error ? err.message : String(err) },
        "Google OAuth callback authentication failed",
      );
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
    const refreshToken = this.getRefreshTokenFromRequest(request);
    const result = await this.authService.refreshSession(
      refreshToken,
      createRequestContext(request),
    );

    setAuthCookies(response, result.tokens);

    return sendSuccess(response, {
      message: AUTH_RESPONSE_MESSAGES.REFRESHED,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  };

  public logout = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const refreshToken =
      this.getOptionalCookie(request, AUTH_COOKIE_NAMES.REFRESH_TOKEN) ||
      (request.body as { refreshToken?: string } | undefined)?.refreshToken;

    await this.authService.logout(refreshToken);

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

  private getRefreshTokenFromRequest(request: Request): string {
    const cookieToken = this.getOptionalCookie(
      request,
      AUTH_COOKIE_NAMES.REFRESH_TOKEN,
    );
    if (cookieToken) return cookieToken;

    const bodyToken = (request.body as { refreshToken?: string } | undefined)
      ?.refreshToken;
    if (bodyToken && typeof bodyToken === "string") return bodyToken;

    const headerToken = request.headers["x-refresh-token"];
    if (headerToken && typeof headerToken === "string") return headerToken;

    throw new AppError(
      AUTH_RESPONSE_MESSAGES.INVALID_REFRESH_TOKEN,
      HTTP_STATUS.UNAUTHORIZED,
      [],
      true,
      APP_ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

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

  private parseState(state: unknown): {
    nonce: string;
    origin?: string;
    redirect?: string;
  } {
    if (typeof state !== "string") {
      return { nonce: "" };
    }
    try {
      const decoded = Buffer.from(state, "base64url").toString("utf-8");
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed.nonce === "string") {
        return parsed;
      }
    } catch {
      // not JSON
    }
    return { nonce: state };
  }

  private isValidGoogleOAuthState(
    submittedState: unknown,
    expectedState: string | undefined,
  ): boolean {
    if (typeof submittedState !== "string" || !expectedState) {
      return false;
    }

    const parsed = this.parseState(submittedState);
    const submittedNonce = parsed.nonce;

    const submitted = Buffer.from(submittedNonce);
    const expected = Buffer.from(expectedState);

    return (
      submitted.length === expected.length &&
      timingSafeEqual(submitted, expected)
    );
  }
}
