import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/contexts/auth.context";
import {
  AdminAnalyticsPage,
  AdminCustomersPage,
  AdminHealthLogsPage,
  AdminNotificationsPage,
  AdminOrdersPage,
  AdminPaymentsPage,
  AdminSettingsPage,
} from "@/features/admin";
import { adminOperationsService } from "@/features/admin/services/adminOperations.service";

describe("Admin Operations Dashboard & Full Modules Tests", () => {
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

  it("renders AdminCustomersPage accounts directory", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminCustomersPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Customer Accounts & Directory")).toBeDefined();
  });

  it("renders AdminPaymentsPage transactions audit table", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminPaymentsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Razorpay Payment Transactions & Audit")).toBeDefined();
  });

  it("renders AdminNotificationsPage broadcast dispatch manager", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminNotificationsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Notification & Broadcast Dispatch Engine")).toBeDefined();
    expect(screen.getByText("Send Customer Broadcast")).toBeDefined();
  });

  it("renders AdminAnalyticsPage revenue and sales KPIs", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminAnalyticsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Platform Sales & Operations Analytics")).toBeDefined();
    expect(screen.getByText("Total Gross Revenue")).toBeDefined();
  });

  it("renders AdminSettingsPage delivery & store settings form", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminSettingsPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Standard Delivery Fee/i)).toBeDefined();
    expect(screen.getByText(/Store Business Name/i)).toBeDefined();
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
    expect(typeof adminOperationsService.getCustomers).toBe("function");
    expect(typeof adminOperationsService.getPayments).toBe("function");
    expect(typeof adminOperationsService.getNotifications).toBe("function");
    expect(typeof adminOperationsService.getSettings).toBe("function");
    expect(typeof adminOperationsService.getPlatformHealth).toBe("function");
    expect(typeof adminOperationsService.getSystemMetrics).toBe("function");
    expect(typeof adminOperationsService.getAuditLogs).toBe("function");
  });
});
