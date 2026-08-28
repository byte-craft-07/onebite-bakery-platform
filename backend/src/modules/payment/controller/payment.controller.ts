import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type { CreatePaymentDto, VerifyPaymentDto } from "../dto/index.js";
import type { PaymentService } from "../service/index.js";

interface RazorpayWebhookRequest extends Request {
  rawBody?: Buffer;
}

export class PaymentController {
  public constructor(private readonly paymentService: PaymentService) {}

  public createPayment = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.id || "guest-user";
    const result = await this.paymentService.createPayment(
      userId,
      request.body as CreatePaymentDto,
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Payment order created successfully.",
      data: { payment: result },
    });
  };

  public verifyPayment = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.id || "guest-user";
    const result = await this.paymentService.verifyPayment(
      userId,
      request.body as VerifyPaymentDto,
    );

    return sendSuccess(response, {
      message: "Payment verified successfully.",
      data: { payment: result },
    });
  };

  public getPaymentDetails = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.id || "guest-user";
    const paymentId = this.getIdParam(request);

    const payment = await this.paymentService.getPaymentDetails(
      userId,
      paymentId,
    );

    return sendSuccess(response, {
      message: "Payment details fetched successfully.",
      data: { payment },
    });
  };

  public handleWebhook = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const webhookRequest = request as RazorpayWebhookRequest;
    const signature = request.headers["x-razorpay-signature"];
    const rawBody =
      webhookRequest.rawBody?.toString("utf8") ??
      (typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body));

    const result = await this.paymentService.handleWebhook(
      rawBody,
      typeof signature === "string" ? signature : "",
      request.body as { event?: string; payload?: Record<string, unknown> },
    );

    return sendSuccess(response, {
      message: result.message,
      data: result,
    });
  };

  private getIdParam(request: Request): string {
    const id = request.params.id;

    if (typeof id !== "string") {
      throw new Error("Validated payment id parameter is missing.");
    }

    return id;
  }
}
