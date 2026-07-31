import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { OrderFailurePage, OrderSuccessPage } from "@/pages/customer/PaymentPages";
import { favoritesService } from "@/services/favorites.service";
import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";

describe("Orders, Payments & Favorites Services Tests", () => {
  it("renders OrderSuccessPage and OrderFailurePage components", () => {
    render(
      <MemoryRouter>
        <OrderSuccessPage />
        <OrderFailurePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Payment Successful!")).toBeDefined();
    expect(screen.getByText("Payment Failed")).toBeDefined();
  });

  it("tests paymentService method definitions", () => {
    expect(typeof paymentService.initiatePayment).toBe("function");
    expect(typeof paymentService.verifyPayment).toBe("function");
  });

  it("tests orderService method definitions", () => {
    expect(typeof orderService.getCustomerOrders).toBe("function");
    expect(typeof orderService.getOrderById).toBe("function");
    expect(typeof orderService.cancelOrder).toBe("function");
  });

  it("tests favoritesService method definitions", () => {
    expect(typeof favoritesService.getFavorites).toBe("function");
    expect(typeof favoritesService.addFavorite).toBe("function");
    expect(typeof favoritesService.removeFavorite).toBe("function");
  });
});
