import { describe, expect, it, vi } from "vitest";
import { Msg91OtpProvider } from "./msg91-otp.provider.js";

describe("Msg91OtpProvider", () => {
  it("delivers OTP without throwing error in dev mode when MSG91_AUTH_KEY is unconfigured", async () => {
    const provider = new Msg91OtpProvider();

    await expect(
      provider.sendOtp({
        phone: "9876543210",
        purpose: "login",
        otp: "123456",
        expiresAt: new Date(Date.now() + 300000),
      }),
    ).resolves.toBeUndefined();
  });
});
