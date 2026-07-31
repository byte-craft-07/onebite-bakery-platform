import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthProvider } from "@/contexts/auth.context";
import {
  AdminCard,
  AdminDashboardShell,
  AdminLayout,
  AdminPageHeader,
  AdminStatCard,
  Sidebar,
  Topbar,
} from "@/features/admin";

describe("Admin Panel Foundation Tests", () => {
  it("renders AdminPageHeader and AdminStatCard", () => {
    render(
      <MemoryRouter>
        <AdminPageHeader title="Test Title" description="Test Description" />
        <AdminStatCard title="Total Revenue" value="₹50,000" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Test Title")).toBeDefined();
    expect(screen.getByText("Total Revenue")).toBeDefined();
    expect(screen.getByText("₹50,000")).toBeDefined();
  });

  it("renders Sidebar and Topbar navigation components", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Sidebar isOpen={true} />
          <Topbar onMenuToggle={() => {}} />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Catalog & Products")).toBeDefined();
    expect(screen.getByText("Order Management")).toBeDefined();
  });

  it("renders AdminDashboardShell with stat widgets", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminDashboardShell />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText("Platform Administration Dashboard")).toBeDefined();
    expect(screen.getByText("Total Products")).toBeDefined();
    expect(screen.getByText("Total Orders")).toBeDefined();
  });
});
