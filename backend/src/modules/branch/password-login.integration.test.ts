import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../auth/utils/password.js";

describe("Branch Admin Password Hashing & Verification Integration", () => {
  it("should securely hash and verify branch admin passwords", () => {
    const rawPassword = "Branch@SecurePassword123";
    const hashedPassword = hashPassword(rawPassword);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).toContain(":");

    const isValid = verifyPassword(rawPassword, hashedPassword);
    expect(isValid).toBe(true);

    const isInvalid = verifyPassword("WrongPassword", hashedPassword);
    expect(isInvalid).toBe(false);
  });
});
