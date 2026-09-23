import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { AUTH_COOKIE_NAMES } from "../constants/index.js";
import { AuthController } from "./auth.controller.js";

const createResponse = () => {
  const response = {
    clearCookie: vi.fn(),
    cookie: vi.fn(),
    redirect: vi.fn(),
  };

  return {
    response: response as unknown as Response,
    spies: response,
  };
};

describe("AuthController Google OAuth state", () => {
  it("binds an OAuth redirect to a one-time HttpOnly state cookie", async () => {
    const getGoogleAuthUrl = vi.fn().mockReturnValue("https://accounts.google.com/o/oauth2/v2/auth");
    const controller = new AuthController({ getGoogleAuthUrl } as never);
    const { response, spies } = createResponse();

    await controller.googleRedirect({} as Request, response);

    const [name, state, options] = spies.cookie.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(name).toBe(AUTH_COOKIE_NAMES.GOOGLE_OAUTH_STATE);
    expect(state).toHaveLength(43);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(getGoogleAuthUrl).toHaveBeenCalledWith(state);
    expect(spies.redirect).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
  });

  it("rejects a callback with a missing or mismatched state", async () => {
    const authenticateWithGoogle = vi.fn();
    const controller = new AuthController({ authenticateWithGoogle } as never);
    const { response, spies } = createResponse();
    const request = {
      cookies: { [AUTH_COOKIE_NAMES.GOOGLE_OAUTH_STATE]: "expected-state" },
      query: { code: "authorization-code", state: "wrong-state" },
    } as unknown as Request;

    await controller.googleCallback(request, response);

    expect(authenticateWithGoogle).not.toHaveBeenCalled();
    expect(spies.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAMES.GOOGLE_OAUTH_STATE,
      expect.objectContaining({ path: "/api/v1/auth/google" }),
    );
    expect(spies.redirect).toHaveBeenCalledWith(
      expect.stringContaining("error=google_invalid_state"),
    );
  });
});
