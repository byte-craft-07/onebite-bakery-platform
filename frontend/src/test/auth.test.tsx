import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/contexts/auth.context";
import { CustomerAuthContainer } from "@/pages/auth/CustomerAuthContainer";
import { SessionExpiredPage, UnauthorizedPage } from "@/pages/auth/StatusPages";
import { authService } from "@/services/auth.service";
import { formatPhoneForMsg91 } from "@/services/msg91.service";
import { UserAvatar, getAvatarFromEmailOrName } from "@/components/common/UserAvatar";

describe("Customer Authentication & Login Tests", () => {
  it("renders CustomerAuthContainer with Google login", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <CustomerAuthContainer />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText("Log in or sign up")).toBeDefined();
    expect(screen.getByText("Continue with Google")).toBeDefined();
    expect(
      screen.getByText("Experience fresh artisanal bakery delicacies delivered to you."),
    ).toBeDefined();
    expect(screen.getByText("256-Bit Encrypted & Secure Authentication")).toBeDefined();
  });

  it("formats Indian phone numbers correctly for MSG91 (no + sign, 91 prefix)", () => {
    expect(formatPhoneForMsg91("9876543210")).toBe("919876543210");
    expect(formatPhoneForMsg91("+91 98765-43210")).toBe("919876543210");
    expect(formatPhoneForMsg91("919876543210")).toBe("919876543210");
  });

  it("tests authService method definitions including verifyPhoneAccessToken", () => {
    expect(typeof authService.sendOtp).toBe("function");
    expect(typeof authService.verifyOtp).toBe("function");
    expect(typeof authService.verifyPhoneAccessToken).toBe("function");
    expect(typeof authService.getCurrentUser).toBe("function");
    expect(typeof authService.logout).toBe("function");
    expect(typeof authService.logoutAll).toBe("function");
  });

  it("renders StatusPages (Unauthorized and Session Expired)", () => {
    render(
      <MemoryRouter>
        <UnauthorizedPage />
        <SessionExpiredPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("403 - Access Denied")).toBeDefined();
    expect(screen.getByText("Session Expired")).toBeDefined();
  });

  it("renders UserAvatar with user details and email avatar fallback", () => {
    const avatarUrl = getAvatarFromEmailOrName("John Doe", "john@example.com");
    expect(avatarUrl).toContain("ui-avatars.com");
    expect(avatarUrl).toContain("John");

    const { container } = render(
      <UserAvatar
        user={{
          id: "usr-123",
          name: "John Doe",
          email: "john@example.com",
          role: "customer",
          profileImage: "https://example.com/avatar.jpg",
        }}
        size="lg"
      />,
    );

    const img = container.querySelector("img");
    expect(img).toBeDefined();
    expect(img?.getAttribute("src")).toBe("https://example.com/avatar.jpg");
  });
});
