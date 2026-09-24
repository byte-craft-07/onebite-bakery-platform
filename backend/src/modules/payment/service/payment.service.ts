import type { HydratedDocument } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { env } from "../../../config/env.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { OrderModel } from "../../order/index.js";
import type { CreatePaymentDto, VerifyPaymentDto } from "../dto/index.js";
import { type Payment } from "../model/index.js";

import { RazorpayProvider, type IPaymentProvider } from "../provider/index.js";
import type { PaymentRepository } from "../repository/index.js";
import type {
  CreatePaymentResponse,
  PaymentDetailsResponse,
  VerifyPaymentResponse,
} from "../types/index.js";

interface RazorpayPaymentWebhookEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
  error_description?: string;
}

export class PaymentService {
  private readonly provider: IPaymentProvider;

  public constructor(
    private readonly paymentRepository: PaymentRepository,
    provider?: IPaymentProvider,
  ) {
    this.provider = provider ?? new RazorpayProvider();
  }

  public async createPayment(
    customerId: string,
    dto: CreatePaymentDto,
  ): Promise<CreatePaymentResponse> {
    const orderObjId = toObjectId(dto.orderId);
    const customerObjId = toObjectId(customerId);

    if (dto.provider && dto.provider !== "RAZORPAY") {
      throw new AppError(
        "Only UPI payments through Razorpay are supported.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_GATEWAY_ERROR,
      );
    }

    const order = await OrderModel.findById(orderObjId).exec();

    if (!order) {
      throw new AppError(
        "Order not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.ORDER_NOT_FOUND,
      );
    }

    if (
      order.customerId.toString() !== customerId &&
      order.userId?.toString() !== customerId
    ) {
      throw new AppError(
        "You are not authorized to create a payment for this order.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    if (order.paymentStatus === "SUCCESS") {
      throw new AppError(
        "Order has already been paid.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_ALREADY_PAID,
      );
    }

    if (order.orderStatus !== "PENDING") {
      throw new AppError(
        `Payment cannot be initiated for order in status '${order.orderStatus}'. Only PENDING orders can be paid.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_INVALID_ORDER_STATUS,
      );
    }

    // A payment order is created once and reused for every retry. This avoids
    // duplicate gateway orders (and potentially duplicate customer charges).
    const existingPayment = await this.paymentRepository.findByOrder(orderObjId);
    if (existingPayment) {
      if (existingPayment.paymentStatus === "CAPTURED") {
        throw new AppError(
          "Order has already been paid.",
          HTTP_STATUS.BAD_REQUEST,
          [],
          true,
          APP_ERROR_CODES.PAYMENT_ALREADY_PAID,
        );
      }

      return this.toCreatePaymentResponse(existingPayment);
    }

    // Always calculate amount from server-side order snapshot
    const payableAmount = order.pricingSnapshot?.grandTotal ?? order.totalAmount;

    if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
      throw new AppError(
        "Order payable amount is invalid.",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_GATEWAY_ERROR,
      );
    }

    const providerResult = await this.provider.createOrder(
      payableAmount,
      "INR",
      order.orderNumber,
    );

    const payment = await this.paymentRepository.create({
      orderId: order._id,
      userId: customerObjId,
      provider: "RAZORPAY",
      providerOrderId: providerResult.providerOrderId,
      amount: payableAmount,
      currency: "INR",
      paymentStatus: "CREATED",
      paymentMethod: "UPI",
    });

    if (order.paymentStatus === "PENDING") {
      order.paymentStatus = "PROCESSING";
      await order.save();
    }

    return this.toCreatePaymentResponse(payment);
  }

  public async verifyPayment(
    customerId: string,
    dto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResponse> {
    const orderObjId = toObjectId(dto.orderId);

    const order = await OrderModel.findById(orderObjId).exec();

    if (!order) {
      throw new AppError(
        "Order not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.ORDER_NOT_FOUND,
      );
    }

    if (
      order.customerId.toString() !== customerId &&
      order.userId?.toString() !== customerId
    ) {
      throw new AppError(
        "You are not authorized to verify payment for this order.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    const payment = await this.paymentRepository.findByProviderOrder(
      dto.razorpayOrderId,
    );

    if (!payment) {
      throw new AppError(
        "Payment record not found for provider order ID.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_NOT_FOUND,
      );
    }

    if (
      payment.orderId.toString() !== orderObjId.toString() ||
      payment.userId.toString() !== customerId
    ) {
      throw new AppError(
        "Payment record does not match this order.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    if (payment.paymentStatus === "CAPTURED") {
      return {
        success: true,
        paymentId: payment._id.toString(),
        orderId: order._id.toString(),
        paymentStatus: "CAPTURED",
        message: "Payment has already been captured.",
      };
    }

    const isValidSignature = this.provider.verifySignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );

    if (!isValidSignature) {
      await this.paymentRepository.updateStatus(payment._id, "FAILED", {
        failureReason: "Invalid payment signature verification",
      });

      throw new AppError(
        "Invalid payment signature.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_INVALID_SIGNATURE,
      );
    }

    await this.paymentRepository.updateStatus(payment._id, "CAPTURED", {
      providerPaymentId: dto.razorpayPaymentId,
      paymentMethod: "UPI",
    });

    order.paymentStatus = "SUCCESS";
    if (order.orderStatus === "PENDING") {
      order.orderStatus = "CONFIRMED";
    }
    await order.save();

    return {
      success: true,
      paymentId: payment._id.toString(),
      orderId: order._id.toString(),
      paymentStatus: "CAPTURED",
      message: "Payment signature verified successfully.",
    };
  }

  public async getPaymentDetails(
    customerId: string,
    paymentId: string,
  ): Promise<PaymentDetailsResponse> {
    const paymentObjId = toObjectId(paymentId);
    const payment = await this.paymentRepository.findById(paymentObjId);

    if (!payment) {
      throw new AppError(
        "Payment details not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_NOT_FOUND,
      );
    }

    if (payment.userId.toString() !== customerId) {
      throw new AppError(
        "You are not authorized to view this payment.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    return this.toResponse(payment);
  }

  public async handleWebhook(
    rawBody: string,
    signature: string,
    eventPayload: { event?: string; payload?: Record<string, unknown> },
  ): Promise<{ processed: boolean; message: string }> {
    const webhookSecret = env.razorpayWebhookSecret;

    if (!webhookSecret) {
      throw new AppError(
        "Razorpay webhook secret is not configured.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_GATEWAY_ERROR,
      );
    }

    const isValidWebhook = this.provider.verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    if (!isValidWebhook) {
      throw new AppError(
        "Invalid webhook signature.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_INVALID_SIGNATURE,
      );
    }

    const event = eventPayload.event;
    const paymentEntity = this.getPaymentEntity(eventPayload);

    if (event === "payment.captured") {
      if (!paymentEntity?.order_id) {
        return {
          processed: true,
          message: "Webhook ignored because payment order id was missing.",
        };
      }

      const payment = await this.paymentRepository.findByProviderOrder(
        paymentEntity.order_id,
      );

      if (!payment) {
        return {
          processed: true,
          message: "Webhook ignored because payment record was not found.",
        };
      }

      if (payment.paymentStatus === "CAPTURED") {
        return {
          processed: true,
          message: "Webhook already processed.",
        };
      }

      this.assertCapturedPaymentMatchesRecord(payment, paymentEntity);

      await this.paymentRepository.updateStatus(payment._id, "CAPTURED", {
        ...(paymentEntity.id ? { providerPaymentId: paymentEntity.id } : {}),
        paymentMethod: "UPI",
      });

      const order = await OrderModel.findById(payment.orderId).exec();
      if (order && order.paymentStatus !== "SUCCESS") {
        order.paymentStatus = "SUCCESS";
        if (order.orderStatus === "PENDING") {
          order.orderStatus = "CONFIRMED";
        }
        await order.save();
      }
    }

    if (event === "payment.failed") {
      if (paymentEntity?.order_id) {
        const payment = await this.paymentRepository.findByProviderOrder(
          paymentEntity.order_id,
        );

        if (payment && payment.paymentStatus !== "CAPTURED") {
          await this.paymentRepository.updateStatus(payment._id, "FAILED", {
            ...(paymentEntity.id ? { providerPaymentId: paymentEntity.id } : {}),
            failureReason:
              paymentEntity.error_description ?? "Razorpay payment failed.",
          });

          const order = await OrderModel.findById(payment.orderId).exec();
          if (order && order.paymentStatus !== "SUCCESS") {
            order.paymentStatus = "FAILED";
            await order.save();
          }
        }
      }
    }

    return {
      processed: true,
      message: "Webhook event processed successfully.",
    };
  }

  private getPaymentEntity(eventPayload: {
    payload?: Record<string, unknown>;
  }): RazorpayPaymentWebhookEntity | undefined {
    const payment = eventPayload.payload?.payment;

    if (!payment || typeof payment !== "object") {
      return undefined;
    }

    const entity = (payment as { entity?: unknown }).entity;

    if (!entity || typeof entity !== "object") {
      return undefined;
    }

    return entity as RazorpayPaymentWebhookEntity;
  }

  private assertCapturedPaymentMatchesRecord(
    payment: HydratedDocument<Payment>,
    paymentEntity: RazorpayPaymentWebhookEntity,
  ): void {
    const expectedAmount = Math.round(payment.amount * 100);

    if (
      paymentEntity.amount !== expectedAmount ||
      paymentEntity.currency !== payment.currency ||
      paymentEntity.method !== "upi" ||
      paymentEntity.status !== "captured"
    ) {
      throw new AppError(
        "Razorpay payment details do not match the internal payment record.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.PAYMENT_GATEWAY_ERROR,
      );
    }
  }

  private toCreatePaymentResponse(
    payment: Pick<Payment, "_id" | "orderId" | "provider" | "providerOrderId" | "amount" | "currency">,
  ): CreatePaymentResponse {
    const razorpayKeyId =
      this.provider instanceof RazorpayProvider
        ? this.provider.getKeyId()
        : undefined;

    return {
      paymentId: payment._id.toString(),
      orderId: payment.orderId.toString(),
      provider: payment.provider,
      providerOrderId: payment.providerOrderId,
      amount: payment.amount,
      currency: payment.currency,
      ...(razorpayKeyId ? { razorpayKeyId } : {}),
    };
  }

  private toResponse(payment: HydratedDocument<Payment>): PaymentDetailsResponse {
    return {
      id: payment._id.toString(),
      orderId: payment.orderId.toString(),
      userId: payment.userId.toString(),
      provider: payment.provider,
      providerOrderId: payment.providerOrderId,
      ...(payment.providerPaymentId ? { providerPaymentId: payment.providerPaymentId } : {}),
      amount: payment.amount,
      currency: payment.currency,
      paymentStatus: payment.paymentStatus,
      ...(payment.paymentMethod ? { paymentMethod: payment.paymentMethod } : {}),
      ...(payment.failureReason ? { failureReason: payment.failureReason } : {}),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
