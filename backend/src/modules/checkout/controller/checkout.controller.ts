import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type {
  CheckoutPreviewQueryDto,
  ValidateCheckoutDto,
} from "../dto/index.js";
import type { CheckoutService } from "../service/index.js";

export class CheckoutController {
  public constructor(private readonly checkoutService: CheckoutService) {}

  public getSummary = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const summary = await this.checkoutService.getCheckoutSummary(
      authenticatedRequest.user.id,
      request.query as CheckoutPreviewQueryDto,
    );

    return sendSuccess(response, {
      message: "Checkout summary generated successfully.",
      data: summary,
    });
  };

  public validate = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const result = await this.checkoutService.validateCheckout(
      authenticatedRequest.user.id,
      request.body as ValidateCheckoutDto,
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.OK,
      message: result.isValid
        ? "Checkout validation successful."
        : "Checkout validation completed with issues.",
      data: result,
    });
  };
}
