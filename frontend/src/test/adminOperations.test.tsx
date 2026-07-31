import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/contexts/auth.context";
import { AdminHealthLogsPage, AdminOrdersPage } from "@/features/admin";
import { adminOperationsService } from "@/features/admin/services/adminOperations.service";

describe("Admin Operations Dashboard & Dispatch Tests", () => {
  it("renders AdminOrdersPage dispatch table layout", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminOrdersPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Order Management & Dispatch Console")).toBeDefined();
    expect(screen.getByText("PENDING")).toBeDefined();
  });

  it("renders AdminHealthLogsPage system health & audit log viewer", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminHealthLogsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Platform Operations & Audit Logs")).toBeDefined();
    expect(screen.getByText("Server Health Status")).toBeDefined();
  });

  it("tests adminOperationsService method definitions", () => {
    expect(typeof adminOperationsService.getAllOrders).toBe("function");
    expect(typeof adminOperationsService.updateOrderStatus).toBe("function");
    expect(typeof adminOperationsService.getPlatformHealth).toBe("function");
    expect(typeof adminOperationsService.getSystemMetrics).toBe("function");
    expect(typeof adminOperationsService.getAuditLogs).toBe("function");
  });
});
