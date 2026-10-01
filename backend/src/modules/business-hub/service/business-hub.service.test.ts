import { describe, expect, it } from "vitest";

import { safeUrlValidator } from "../validators/business-hub.validators.js";
import { businessHubService } from "./business-hub.service.js";
import type { BusinessDayHours } from "../model/business-hub.model.js";

describe("Business Hub - Validation & Business Logic", () => {
  describe("safeUrlValidator", () => {
    it("accepts valid https URLs", () => {
      const res = safeUrlValidator.safeParse("https://onebitebakery.in/products");
      expect(res.success).toBe(true);
    });

    it("accepts tel and mailto links", () => {
      expect(safeUrlValidator.safeParse("tel:+919876543210").success).toBe(true);
      expect(safeUrlValidator.safeParse("mailto:hello@onebitebakery.in").success).toBe(true);
    });

    it("accepts relative paths and hash anchors", () => {
      expect(safeUrlValidator.safeParse("/products").success).toBe(true);
      expect(safeUrlValidator.safeParse("#about").success).toBe(true);
    });

    it("strictly blocks malicious javascript: and data: URLs", () => {
      const xss1 = safeUrlValidator.safeParse("javascript:alert(1)");
      expect(xss1.success).toBe(false);

      const xss2 = safeUrlValidator.safeParse("data:text/html,<script>alert(1)</script>");
      expect(xss2.success).toBe(false);

      const xss3 = safeUrlValidator.safeParse("vbscript:msgbox(1)");
      expect(xss3.success).toBe(false);
    });
  });

  describe("calculateBusinessStatus", () => {
    const mockHours: BusinessDayHours[] = [
      { day: "monday", openTime: "00:00", closeTime: "23:59", isClosed: false },
      { day: "tuesday", openTime: "09:00", closeTime: "21:00", isClosed: false },
      { day: "wednesday", openTime: "09:00", closeTime: "21:00", isClosed: false },
      { day: "thursday", openTime: "09:00", closeTime: "21:00", isClosed: false },
      { day: "friday", openTime: "09:00", closeTime: "21:00", isClosed: false },
      { day: "saturday", openTime: "09:00", closeTime: "21:00", isClosed: false },
      { day: "sunday", openTime: "10:00", closeTime: "18:00", isClosed: true },
    ];

    it("returns correctly formatted status object", () => {
      const status = businessHubService.calculateBusinessStatus(mockHours);
      expect(status).toHaveProperty("isOpen");
      expect(status).toHaveProperty("statusText");
      expect(status).toHaveProperty("currentDay");
    });

    it("returns closed when day is marked closed", () => {
      const closedDayHours: BusinessDayHours[] = [
        { day: "monday", openTime: "09:00", closeTime: "21:00", isClosed: true },
        { day: "tuesday", openTime: "09:00", closeTime: "21:00", isClosed: true },
        { day: "wednesday", openTime: "09:00", closeTime: "21:00", isClosed: true },
        { day: "thursday", openTime: "09:00", closeTime: "21:00", isClosed: true },
        { day: "friday", openTime: "09:00", closeTime: "21:00", isClosed: true },
        { day: "saturday", openTime: "09:00", closeTime: "21:00", isClosed: true },
        { day: "sunday", openTime: "09:00", closeTime: "21:00", isClosed: true },
      ];
      const status = businessHubService.calculateBusinessStatus(closedDayHours);
      expect(status.isOpen).toBe(false);
      expect(status.statusText).toBe("Closed Today");
    });

    it("returns open when all day hours are open", () => {
      const allOpenHours: BusinessDayHours[] = [
        { day: "monday", openTime: "00:00", closeTime: "23:59", isClosed: false },
        { day: "tuesday", openTime: "00:00", closeTime: "23:59", isClosed: false },
        { day: "wednesday", openTime: "00:00", closeTime: "23:59", isClosed: false },
        { day: "thursday", openTime: "00:00", closeTime: "23:59", isClosed: false },
        { day: "friday", openTime: "00:00", closeTime: "23:59", isClosed: false },
        { day: "saturday", openTime: "00:00", closeTime: "23:59", isClosed: false },
        { day: "sunday", openTime: "00:00", closeTime: "23:59", isClosed: false },
      ];
      const status = businessHubService.calculateBusinessStatus(allOpenHours);
      expect(status.isOpen).toBe(true);
      expect(status.statusText).toBe("Open Now");
    });
  });
});
