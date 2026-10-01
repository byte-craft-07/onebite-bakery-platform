import { describe, expect, it } from "vitest";

import { AUTH_TOKEN_TYPES } from "../constants/index.js";
import {
  generateAuthTokens,
  generateDeviceId,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt.js";

describe("JWT utilities", () => {
  it("generates verifiable access and refresh tokens", () => {
    const deviceId = generateDeviceId();
    const tokens = generateAuthTokens({
      userId: "507f1f77bcf86cd799439011",
      role: "customer",
      deviceId,
    });

    const accessPayload = verifyAccessToken(tokens.accessToken);
    const refreshPayload = verifyRefreshToken(tokens.refreshToken);

    expect(accessPayload.sub).toBe("507f1f77bcf86cd799439011");
    expect(accessPayload.type).toBe(AUTH_TOKEN_TYPES.ACCESS);
    expect(refreshPayload.deviceId).toBe(deviceId);
    expect(refreshPayload.type).toBe(AUTH_TOKEN_TYPES.REFRESH);

    // 60 days in milliseconds: 60 * 24 * 60 * 60 * 1000 = 5,184,000,000 ms
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    expect(tokens.accessTokenMaxAgeMs).toBe(sixtyDaysMs);
    expect(tokens.refreshTokenMaxAgeMs).toBe(sixtyDaysMs);
  });

  it("calculates 2 months / 60 days correctly with durationToMs", async () => {
    const { durationToMs, durationToSeconds } = await import("./token-expiry.js");
    expect(durationToMs("60d")).toBe(60 * 24 * 60 * 60 * 1000);
    expect(durationToSeconds("60d")).toBe(60 * 24 * 60 * 60);
    expect(durationToMs("2M")).toBe(60 * 24 * 60 * 60 * 1000);
    expect(durationToMs("2mo")).toBe(60 * 24 * 60 * 60 * 1000);
    expect(durationToMs("2months")).toBe(60 * 24 * 60 * 60 * 1000);
  });
});
