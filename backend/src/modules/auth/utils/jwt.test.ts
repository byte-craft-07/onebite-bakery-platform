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
  });
});
