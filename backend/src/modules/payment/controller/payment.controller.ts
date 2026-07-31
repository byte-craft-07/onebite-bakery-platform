import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type { CreatePaymentDto, VerifyPaymentDto } from "../dto/index.js";
import type { PaymentService } from "../service/index.js";

export class PaymentController {
  public constructor(private readonly paymentService: PaymentService) {}

  public createPayment = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const result = await this.paymentService.createPayment(
      authenticatedRequest.user.id,
      request.body as CreatePaymentDto,
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Payment order created successfully.",
      data: result,
    });
  };

  public verifyPayment = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const result = await this.paymentService.verifyPayment(
      authenticatedRequest.user.id,
      request.body as VerifyPaymentDto,
    );

    return sendSuccess(response, {
      message: "Payment verified successfully.",
      data: result,
    });
  };

  public getPaymentDetails = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const paymentId = this.getIdParam(request);

    const payment = await this.paymentService.getPaymentDetails(
      authenticatedRequest.user.id,
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
    const signature = request.headers["x-razorpay-signature"];
    const rawBody =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body);

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
