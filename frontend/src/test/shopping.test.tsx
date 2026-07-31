import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { CartItemCard } from "@/components/shopping/CartItemCard";
import { CheckoutSummary, DeliverySelector } from "@/components/shopping/CheckoutComponents";
import { AuthProvider } from "@/contexts/auth.context";
import { cartService } from "@/services/cart.service";
import { checkoutService } from "@/services/checkout.service";

describe("Shopping Experience & Cart/Checkout Services Tests", () => {
  it("renders CartItemCard with item details and quantity controls", () => {
    const sampleItem = {
      id: "item-1",
      productId: {
        id: "prod-1",
        name: "Belgian Truffle Cake",
        slug: "belgian-truffle-cake",
        price: 649,
        isAvailable: true,
      },
      quantity: 2,
      unitPrice: 649,
      itemTotal: 1298,
    };

    render(
      <MemoryRouter>
        <CartItemCard
          item={sampleItem}
          onUpdateQuantity={() => {}}
          onRemove={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Belgian Truffle Cake")).toBeDefined();
    expect(screen.getByText("₹1298")).toBeDefined();
  });

  it("renders DeliverySelector and CheckoutSummary components", () => {
    const pricing = {
      subtotal: 1000,
      deliveryFee: 50,
      taxAmount: 50,
      discountAmount: 0,
      totalAmount: 1100,
    };

    render(
      <MemoryRouter>
        <DeliverySelector fulfillmentType="HOME_DELIVERY" onChange={() => {}} />
        <CheckoutSummary pricing={pricing} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Home Delivery")).toBeDefined();
    expect(screen.getByText("Store Pickup")).toBeDefined();
    expect(screen.getByText("₹1100")).toBeDefined();
  });

  it("tests cartService and checkoutService method definitions", () => {
    expect(typeof cartService.getCart).toBe("function");
    expect(typeof cartService.addItem).toBe("function");
    expect(typeof cartService.updateQuantity).toBe("function");
    expect(typeof cartService.removeItem).toBe("function");
    expect(typeof checkoutService.getCheckoutPreview).toBe("function");
    expect(typeof checkoutService.validateCheckout).toBe("function");
    expect(typeof checkoutService.createOrder).toBe("function");
  });
});
