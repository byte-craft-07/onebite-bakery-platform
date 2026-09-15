import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { NewOrderNotificationModal } from "@/features/admin/components/NewOrderNotificationModal";
import type { NewOrderEventPayload } from "@/services/socket.service";

const mockOrder: NewOrderEventPayload = {
  notificationId: "notif-1001",
  orderId: "order-1001",
  orderNumber: "OB-20260907-TEST99",
  customer: {
    name: "Ajay Sharma",
    phone: "9876543210",
  },
  items: [
    { name: "Black Forest Cake", quantity: 1 },
    { name: "Vanilla Cupcake", quantity: 4 },
  ],
  totalAmount: 649,
  paymentMethod: "UPI",
  orderType: "HOME_DELIVERY",
  createdAt: new Date().toISOString(),
};

describe("NewOrderNotificationModal", () => {
  it("renders nothing when the queue is empty", () => {
    const { container } = render(
      <BrowserRouter>
        <NewOrderNotificationModal
          ordersQueue={[]}
          onDismiss={vi.fn()}
          onDismissAll={vi.fn()}
        />
      </BrowserRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders order details correctly when an order is in queue", () => {
    render(
      <BrowserRouter>
        <NewOrderNotificationModal
          ordersQueue={[mockOrder]}
          onDismiss={vi.fn()}
          onDismissAll={vi.fn()}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("New Order Received!")).toBeInTheDocument();
    expect(screen.getByText("Order #OB-20260907-TEST99")).toBeInTheDocument();
    expect(screen.getByText("Ajay Sharma")).toBeInTheDocument();
    expect(screen.getByText("9876543210")).toBeInTheDocument();
    expect(screen.getByText("Black Forest Cake")).toBeInTheDocument();
    expect(screen.getByText("Vanilla Cupcake")).toBeInTheDocument();
    expect(screen.getByText("₹649")).toBeInTheDocument();
    expect(screen.getByText("View Order")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <BrowserRouter>
        <NewOrderNotificationModal
          ordersQueue={[mockOrder]}
          onDismiss={onDismiss}
          onDismissAll={vi.fn()}
        />
      </BrowserRouter>,
    );

    const dismissBtn = screen.getByLabelText("Dismiss notification");
    fireEvent.click(dismissBtn);

    expect(onDismiss).toHaveBeenCalledWith("order-1001");
  });

  it("displays queue counter and Dismiss All button when multiple orders are queued", () => {
    const mockOrder2: NewOrderEventPayload = {
      ...mockOrder,
      orderId: "order-1002",
      orderNumber: "OB-20260907-TEST100",
      totalAmount: 1200,
    };

    const onDismissAll = vi.fn();
    render(
      <BrowserRouter>
        <NewOrderNotificationModal
          ordersQueue={[mockOrder, mockOrder2]}
          onDismiss={vi.fn()}
          onDismissAll={onDismissAll}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("+1 more")).toBeInTheDocument();
    const dismissAllBtn = screen.getByText("Dismiss All");
    expect(dismissAllBtn).toBeInTheDocument();

    fireEvent.click(dismissAllBtn);
    expect(onDismissAll).toHaveBeenCalledOnce();
  });
});
