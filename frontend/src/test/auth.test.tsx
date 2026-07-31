import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/contexts/auth.context";
import { CustomerAuthContainer } from "@/pages/auth/CustomerAuthContainer";
import { SessionExpiredPage, UnauthorizedPage } from "@/pages/auth/StatusPages";
import { authService } from "@/services/auth.service";

describe("Customer Authentication & Account Service Tests", () => {
  it("renders CustomerAuthContainer with phone input form initially", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <CustomerAuthContainer />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText("Welcome to OneBite")).toBeDefined();
    expect(screen.getByLabelText("Mobile Number")).toBeDefined();
    expect(screen.getByRole("button", { name: "Send Verification OTP" })).toBeDefined();
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

  it("tests authService method definitions", () => {
    expect(typeof authService.sendOtp).toBe("function");
    expect(typeof authService.verifyOtp).toBe("function");
    expect(typeof authService.getCurrentUser).toBe("function");
    expect(typeof authService.logout).toBe("function");
    expect(typeof authService.logoutAll).toBe("function");
  });
});
