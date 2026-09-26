import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";
import { Badge, Card, Skeleton } from "@/components/ui/DisplayComponents";
import { Input } from "@/components/ui/FormControls";
import { AuthProvider, useAuth } from "@/contexts/auth.context";
import { AppProvider } from "@/providers/app.provider";
import { DESIGN_TOKENS } from "@/theme/tokens";
import { BakeryLoader, FullScreenLoader } from "@/components/common/BakeryLoader";

const TestAuthConsumer: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? "authenticated" : "guest"}</span>
      <span data-testid="auth-role">{role ?? "none"}</span>
    </div>
  );
};

describe("Frontend Component Library & Providers", () => {
  it("renders Button UI component with variants and accessibility focus styles", () => {
    render(<Button variant="primary">Order Fresh Cake</Button>);
    const button = screen.getByRole("button", { name: "Order Fresh Cake" });
    expect(button).toBeDefined();
    expect(button.className).toContain("bg-[#596B58]");
  });

  it("renders Button in loading state with spinner", () => {
    render(<Button isLoading>Processing</Button>);
    const button = screen.getByRole("button");
    expect(button.getAttribute("disabled")).toBe("");
  });

  it("renders Input form control with label and error state", () => {
    render(<Input label="Phone Number" error="Invalid phone number" placeholder="9876543210" />);
    expect(screen.getByLabelText("Phone Number")).toBeDefined();
    expect(screen.getByText("Invalid phone number")).toBeDefined();
  });

  it("renders Card, Badge, and Skeleton display components", () => {
    render(
      <Card data-testid="card-element">
        <Badge variant="success">IN_STOCK</Badge>
        <Skeleton data-testid="skeleton-element" className="h-4 w-24" />
      </Card>,
    );

    expect(screen.getByTestId("card-element")).toBeDefined();
    expect(screen.getByText("IN_STOCK")).toBeDefined();
    expect(screen.getByTestId("skeleton-element")).toBeDefined();
  });

  it("provides AuthContext values via AuthProvider", () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-status").textContent).toBe("guest");
    expect(screen.getByTestId("auth-role").textContent).toBe("none");
  });

  it("verifies design tokens values", () => {
    expect(DESIGN_TOKENS.colors.cream).toBe("#FFF8EC");
    expect(DESIGN_TOKENS.colors.pistachio).toBe("#A8B89A");
    expect(DESIGN_TOKENS.colors.sage).toBe("#596B58");
    expect(DESIGN_TOKENS.colors.cocoa).toBe("#3B302B");
    expect(DESIGN_TOKENS.colors.champagne).toBe("#D8BE91");
  });

  it("renders inside AppProvider wrapper without throwing", () => {
    render(
      <AppProvider>
        <div>App Provider Consumer</div>
      </AppProvider>,
    );

    expect(screen.getByText("App Provider Consumer")).toBeDefined();
  });

  it("renders BakeryLoader and FullScreenLoader with animated bakery elements", () => {
    render(<BakeryLoader message="Baking fresh delights..." subtext="Handcrafted with Love" />);
    expect(screen.getByText("Onebite Bakery")).toBeDefined();
    expect(screen.getByText("Baking fresh delights...")).toBeDefined();
    expect(screen.getByText("Handcrafted with Love")).toBeDefined();

    render(<FullScreenLoader message="Checking authentication..." />);
    expect(screen.getByText("Checking authentication...")).toBeDefined();
  });
});
