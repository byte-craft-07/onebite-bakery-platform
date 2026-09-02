import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { OrderFailurePage, OrderSuccessPage } from "@/pages/customer/PaymentPages";
import { favoritesService } from "@/services/favorites.service";
import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { razorpayService } from "@/services/razorpay.service";

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

  it("tests razorpayService configuration for UPI-only payments", async () => {
    expect(typeof razorpayService.openPaymentModal).toBe("function");
    expect(typeof razorpayService.loadRazorpayScript).toBe("function");

    let constructedOptions: Record<string, unknown> | null = null;

    class MockRazorpay {
      constructor(options: Record<string, unknown>) {
        constructedOptions = options;
      }
      on() {}
      open() {}
    }

    // Mock script loader to simulate Razorpay JS loaded
    vi.spyOn(razorpayService, "loadRazorpayScript").mockResolvedValue(true);
    window.Razorpay = MockRazorpay as unknown as typeof window.Razorpay;

    await razorpayService.openPaymentModal({
      payment: {
        paymentId: "65c1234567890abcdef12345",
        orderId: "65c1234567890abcdef12346",
        amount: 500,
        currency: "INR",
        provider: "RAZORPAY",
        providerOrderId: "order_mock1234567890",
        razorpayKeyId: "rzp_test_mockkey123",
      },
      customerName: "Test Customer",
      customerEmail: "test@theonlinebakery.in",
      customerPhone: "9876543210",
      onSuccess: vi.fn(),
      onDismiss: vi.fn(),
    });

    expect(constructedOptions).not.toBeNull();
    const config = (constructedOptions as unknown as { config: { display: { blocks: { upi: { instruments: Array<{ method: string }> } }; sequence: string[]; preferences: { show_default_blocks: boolean } } } }).config;

    expect(config).toBeDefined();
    expect(config.display.sequence).toEqual(["block.upi"]);
    expect(config.display.preferences.show_default_blocks).toBe(false);
    expect(config.display.blocks.upi.instruments[0].method).toBe("upi");
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

