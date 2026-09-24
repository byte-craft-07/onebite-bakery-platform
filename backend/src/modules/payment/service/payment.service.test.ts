import crypto from "node:crypto";
import { Types, type HydratedDocument } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import { OrderModel, type Order } from "../../order/index.js";
import { type Payment } from "../model/index.js";
import { RazorpayProvider, type IPaymentProvider } from "../provider/index.js";
import type { PaymentRepository } from "../repository/index.js";
import { PaymentService } from "./payment.service.js";

const customerId = new Types.ObjectId().toString();
const otherCustomerId = new Types.ObjectId().toString();
const orderId = new Types.ObjectId();
const paymentId = new Types.ObjectId();

const createMockOrderDocument = (overrides: Partial<Order> = {}): HydratedDocument<Order> => {
  const order = {
    _id: orderId,
    orderNumber: "OB-20260731-PAY01",
    customerId: new Types.ObjectId(customerId),
    userId: new Types.ObjectId(customerId),
    items: [],
    pricingSnapshot: {
      subtotal: 1000,
      tax: 0,
      deliveryCharge: 50,
      discount: 0,
      grandTotal: 1050,
      homeDeliveryAvailable: true,
      pickupAvailable: true,
    },
    subtotal: 1000,
    deliveryCharge: 50,
    totalAmount: 1050,
    deliveryMethod: "HOME_DELIVERY",
    orderStatus: "PENDING",
    paymentStatus: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return order as unknown as HydratedDocument<Order>;
};

const createMockPaymentDocument = (overrides: Partial<Payment> = {}): HydratedDocument<Payment> => {
  const payment = {
    _id: paymentId,
    orderId,
    userId: new Types.ObjectId(customerId),
    provider: "RAZORPAY",
    providerOrderId: "order_rzp_mock_123",
    providerPaymentId: undefined,
    amount: 1050,
    currency: "INR",
    paymentStatus: "CREATED",
    paymentMethod: "UPI",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  return payment as unknown as HydratedDocument<Payment>;
};

const createService = (
  paymentRepoOverrides: Partial<Record<keyof PaymentRepository, unknown>> = {},
  providerOverrides: Partial<IPaymentProvider> = {},
) => {
  const paymentRepository = {
    create: vi
      .fn()
      .mockImplementation((data: Partial<Payment>) =>
        Promise.resolve(createMockPaymentDocument(data)),
      ),
    findById: vi.fn().mockResolvedValue(createMockPaymentDocument()),
    findByOrder: vi.fn().mockResolvedValue(null),
    findByProviderOrder: vi.fn().mockResolvedValue(createMockPaymentDocument()),
    findByProviderPayment: vi.fn().mockResolvedValue(createMockPaymentDocument()),
    updateStatus: vi
      .fn()
      .mockImplementation((id, status, extra) =>
        Promise.resolve(
          createMockPaymentDocument({
            _id: id,
            paymentStatus: status,
            ...extra,
          }),
        ),
      ),
    ...paymentRepoOverrides,
  } as unknown as PaymentRepository;

  const mockProvider: IPaymentProvider = {
    providerName: "RAZORPAY",
    createOrder: vi.fn().mockResolvedValue({
      providerOrderId: "order_rzp_mock_123",
      amount: 1050,
      currency: "INR",
    }),
    verifySignature: vi.fn().mockReturnValue(true),
    verifyWebhookSignature: vi.fn().mockReturnValue(true),
    ...providerOverrides,
  };

  return {
    service: new PaymentService(paymentRepository, mockProvider),
    paymentRepository,
    mockProvider,
  };
};

describe("PaymentService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(OrderModel, "findById").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(createMockOrderDocument()),
    } as unknown as ReturnType<typeof OrderModel.findById>));
  });

  it("creates a provider payment order using server-side order snapshot amount", async () => {
    const { service, paymentRepository, mockProvider } = createService();

    const result = await service.createPayment(customerId, {
      orderId: orderId.toString(),
      provider: "RAZORPAY",
    });

    expect(result.amount).toBe(1050); // Server calculated from order snapshot
    expect(result.providerOrderId).toBe("order_rzp_mock_123");
    expect(mockProvider.createOrder).toHaveBeenCalledWith(1050, "INR", "OB-20260731-PAY01");
    expect(paymentRepository.create).toHaveBeenCalledOnce();
  });

  it("reuses an existing payment order rather than creating a duplicate gateway order", async () => {
    const existingPayment = createMockPaymentDocument();
    const { service, paymentRepository, mockProvider } = createService({
      findByOrder: vi.fn().mockResolvedValue(existingPayment),
    });

    const result = await service.createPayment(customerId, {
      orderId: orderId.toString(),
      provider: "RAZORPAY",
    });

    expect(result.providerOrderId).toBe(existingPayment.providerOrderId);
    expect(mockProvider.createOrder).not.toHaveBeenCalled();
    expect(paymentRepository.create).not.toHaveBeenCalled();
  });

  it("rejects payment creation if order has already been paid", async () => {
    vi.spyOn(OrderModel, "findById").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(
        createMockOrderDocument({ paymentStatus: "SUCCESS" }),
      ),
    } as unknown as ReturnType<typeof OrderModel.findById>));

    const { service } = createService();

    await expect(
      service.createPayment(customerId, { orderId: orderId.toString() }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects payment creation for non-PENDING orders (e.g. CANCELLED)", async () => {
    vi.spyOn(OrderModel, "findById").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(
        createMockOrderDocument({ orderStatus: "CANCELLED" }),
      ),
    } as unknown as ReturnType<typeof OrderModel.findById>));

    const { service } = createService();

    await expect(
      service.createPayment(customerId, { orderId: orderId.toString() }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("verifies payment signature and captures payment", async () => {
    const mockOrderDoc = createMockOrderDocument();
    vi.spyOn(OrderModel, "findById").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(mockOrderDoc),
    } as unknown as ReturnType<typeof OrderModel.findById>));

    const { service, paymentRepository } = createService();

    const response = await service.verifyPayment(customerId, {
      orderId: orderId.toString(),
      razorpayOrderId: "order_rzp_mock_123",
      razorpayPaymentId: "pay_rzp_mock_999",
      razorpaySignature: "valid_hmac_signature_hex",
    });

    expect(response.success).toBe(true);
    expect(paymentRepository.updateStatus).toHaveBeenCalledWith(
      paymentId,
      "CAPTURED",
      { providerPaymentId: "pay_rzp_mock_999", paymentMethod: "UPI" },
    );
    expect(response.paymentStatus).toBe("CAPTURED");
    expect(mockOrderDoc.paymentStatus).toBe("SUCCESS");
    expect(mockOrderDoc.orderStatus).toBe("CONFIRMED");
    expect(mockOrderDoc.save).toHaveBeenCalledOnce();
  });

  it("rejects invalid payment signature and sets payment status to FAILED", async () => {
    const { service, paymentRepository } = createService({}, {
      verifySignature: vi.fn().mockReturnValue(false),
    });

    await expect(
      service.verifyPayment(customerId, {
        orderId: orderId.toString(),
        razorpayOrderId: "order_rzp_mock_123",
        razorpayPaymentId: "pay_rzp_mock_999",
        razorpaySignature: "invalid_signature",
      }),
    ).rejects.toBeInstanceOf(AppError);

    expect(paymentRepository.updateStatus).toHaveBeenCalledWith(
      paymentId,
      "FAILED",
      { failureReason: "Invalid payment signature verification" },
    );
  });

  it("processes webhook payload, verifies webhook signature, and updates payment and order status", async () => {
    const mockOrderDoc = createMockOrderDocument();
    vi.spyOn(OrderModel, "findById").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(mockOrderDoc),
    } as unknown as ReturnType<typeof OrderModel.findById>));

    const { service, paymentRepository } = createService();

    const webhookResult = await service.handleWebhook(
      JSON.stringify({ event: "payment.captured" }),
      "valid_webhook_sig",
      {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              order_id: "order_rzp_mock_123",
              id: "pay_rzp_mock_999",
              amount: 105000,
              currency: "INR",
              method: "upi",
              status: "captured",
            },
          },
        },
      },
    );

    expect(webhookResult.processed).toBe(true);
    expect(paymentRepository.updateStatus).toHaveBeenCalledWith(
      paymentId,
      "CAPTURED",
      { providerPaymentId: "pay_rzp_mock_999", paymentMethod: "UPI" },
    );
    expect(mockOrderDoc.paymentStatus).toBe("SUCCESS");
  });

  it("rejects captured webhook when amount does not match the internal payment record", async () => {
    const { service } = createService();

    await expect(
      service.handleWebhook(
        JSON.stringify({ event: "payment.captured" }),
        "valid_webhook_sig",
        {
          event: "payment.captured",
          payload: {
            payment: {
              entity: {
                order_id: "order_rzp_mock_123",
                id: "pay_rzp_mock_999",
                amount: 104900,
                currency: "INR",
                method: "upi",
                status: "captured",
              },
            },
          },
        },
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("handles duplicate captured webhook idempotently", async () => {
    const { service, paymentRepository } = createService({
      findByProviderOrder: vi
        .fn()
        .mockResolvedValue(createMockPaymentDocument({ paymentStatus: "CAPTURED" })),
    });

    const result = await service.handleWebhook(
      JSON.stringify({ event: "payment.captured" }),
      "valid_webhook_sig",
      {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              order_id: "order_rzp_mock_123",
              id: "pay_rzp_mock_999",
              amount: 105000,
              currency: "INR",
              method: "upi",
              status: "captured",
            },
          },
        },
      },
    );

    expect(result.message).toBe("Webhook already processed.");
    expect(paymentRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("prevents unauthorized user from creating payment for another customer's order", async () => {
    vi.spyOn(OrderModel, "findById").mockImplementation(() => ({
      exec: vi.fn().mockResolvedValue(
        createMockOrderDocument({
          customerId: new Types.ObjectId(otherCustomerId),
          userId: new Types.ObjectId(otherCustomerId),
        }),
      ),
    } as unknown as ReturnType<typeof OrderModel.findById>));

    const { service } = createService();

    await expect(
      service.createPayment(customerId, { orderId: orderId.toString() }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
