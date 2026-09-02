import { describe, expect, it } from "vitest";
import { normalizeIndianPhone } from "./phone-normalizer.js";
import { AppError } from "../../../shared/errors/app-error.js";

describe("normalizeIndianPhone", () => {
  it("normalizes standard 10-digit Indian mobile number", () => {
    expect(normalizeIndianPhone("9876543210")).toBe("9876543210");
  });

  it("normalizes number with +91 country code", () => {
    expect(normalizeIndianPhone("+919876543210")).toBe("9876543210");
  });

  it("normalizes number with 91 prefix without plus", () => {
    expect(normalizeIndianPhone("919876543210")).toBe("9876543210");
  });

  it("normalizes number with leading zero", () => {
    expect(normalizeIndianPhone("09876543210")).toBe("9876543210");
  });

  it("normalizes formatted phone number with spaces and hyphens", () => {
    expect(normalizeIndianPhone("+91 98765-43210")).toBe("9876543210");
  });

  it("rejects invalid phone numbers", () => {
    expect(() => normalizeIndianPhone("12345")).toThrow(AppError);
    expect(() => normalizeIndianPhone("abc")).toThrow(AppError);
  });
});
