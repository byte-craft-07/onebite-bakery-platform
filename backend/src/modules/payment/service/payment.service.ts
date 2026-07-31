import type { HydratedDocument } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
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

    // Always calculate amount from server-side order snapshot
    const payableAmount = order.pricingSnapshot?.grandTotal ?? order.totalAmount;

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
    });

    const razorpayKeyId =
      this.provider instanceof RazorpayProvider
        ? (this.provider as RazorpayProvider).getKeyId()
        : undefined;

    return {
      paymentId: payment._id.toString(),
      orderId: order._id.toString(),
      provider: "RAZORPAY",
      providerOrderId: providerResult.providerOrderId,
      amount: payableAmount,
      currency: "INR",
      ...(razorpayKeyId ? { razorpayKeyId } : {}),
    };
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

    // Mark Payment CAPTURED
    await this.paymentRepository.updateStatus(payment._id, "CAPTURED", {
      providerPaymentId: dto.razorpayPaymentId,
    });

    // Update Order payment and order status
    order.paymentStatus = "SUCCESS";
    order.orderStatus = "CONFIRMED";
    await order.save();

    return {
      success: true,
      paymentId: payment._id.toString(),
      orderId: order._id.toString(),
      paymentStatus: "CAPTURED",
      message: "Payment verified and order confirmed successfully.",
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
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "rzp_test_webhook_secret";

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
    if (event === "payment.captured" || event === "order.paid") {
      const payloadData = eventPayload.payload as
        | { payment?: { entity?: { order_id?: string; id?: string } } }
        | undefined;
      const paymentEntity = payloadData?.payment?.entity;
      const providerOrderId = paymentEntity?.order_id;
      const providerPaymentId = paymentEntity?.id;

      if (providerOrderId) {
        const payment = await this.paymentRepository.findByProviderOrder(
          providerOrderId,
        );

        if (payment && payment.paymentStatus !== "CAPTURED") {
          await this.paymentRepository.updateStatus(payment._id, "CAPTURED", {
            ...(providerPaymentId ? { providerPaymentId } : {}),
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
      }
    }

    return {
      processed: true,
      message: "Webhook event processed successfully.",
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
