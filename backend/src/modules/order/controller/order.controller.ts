import type { Request, Response } from "express";

import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { createRequestContext } from "../../../shared/utils/request-context.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type {
  CancelOrderDto,
  CreateOrderDto,
  ListOrdersFilterDto,
  UpdateOrderStatusDto,
  UpdateReadyTimeDto,
} from "../dto/index.js";
import type { OrderService } from "../service/index.js";

export class OrderController {
  public constructor(private readonly orderService: OrderService) {}

  public create = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const order = await this.orderService.createOrder(
      authenticatedRequest.user.id,
      request.body as CreateOrderDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Order placed successfully.",
      data: { order },
    });
  };

  public listCustomerOrders = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const page = Number(request.query.page ?? 1);
    const limit = Number(request.query.limit ?? 20);

    const result = await this.orderService.getCustomerOrders(
      authenticatedRequest.user.id,
      page,
      limit,
    );

    return sendSuccess(response, {
      message: "Orders fetched successfully.",
      data: result,
    });
  };

  public getCustomerOrder = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const orderId = this.getIdParam(request);

    const order = await this.orderService.getCustomerOrderById(
      authenticatedRequest.user.id,
      orderId,
    );

    return sendSuccess(response, {
      message: "Order details fetched successfully.",
      data: { order },
    });
  };

  public cancelCustomerOrder = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const orderId = this.getIdParam(request);

    const order = await this.orderService.cancelCustomerOrder(
      authenticatedRequest.user.id,
      orderId,
      request.body as CancelOrderDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: "Order cancelled successfully.",
      data: { order },
    });
  };

  public reorder = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const orderId = this.getIdParam(request);

    const result = await this.orderService.reorder(
      authenticatedRequest.user.id,
      orderId,
    );

    return sendSuccess(response, {
      message: "Reorder items added to cart.",
      data: result,
    });
  };

  public adminListOrders = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as Partial<AuthenticatedRequest>;
    const query = { ...(request.query as ListOrdersFilterDto) };

    if (authenticatedRequest.user?.role === "branch_admin") {
      if (!authenticatedRequest.user.branchId) {
        throw new AppError(
          "User does not have an active branch administration scope.",
          HTTP_STATUS.FORBIDDEN,
          [],
          true,
          APP_ERROR_CODES.AUTHORIZATION_FAILED,
        );
      }
      query.branchId = authenticatedRequest.user.branchId;
    }

    const result = await this.orderService.adminListOrders(query);

    return sendSuccess(response, {
      message: "All orders fetched successfully.",
      data: result,
    });
  };

  public adminGetOrder = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as Partial<AuthenticatedRequest>;
    const orderId = this.getIdParam(request);
    const order = await this.orderService.adminGetOrderById(orderId);

    if (authenticatedRequest.user?.role === "branch_admin") {
      const userBranchId = authenticatedRequest.user.branchId;
      const orderBranchId = order.branchSnapshot?.branchId || order.branchId;
      if (!userBranchId || (orderBranchId && orderBranchId.toString() !== userBranchId.toString())) {
        throw new AppError(
          "Access denied: Order does not belong to your assigned branch.",
          HTTP_STATUS.FORBIDDEN,
          [],
          true,
          APP_ERROR_CODES.AUTHORIZATION_FAILED,
        );
      }
    }

    return sendSuccess(response, {
      message: "Order details fetched successfully.",
      data: { order },
    });
  };

  public adminUpdateStatus = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as Partial<AuthenticatedRequest>;
    const orderId = this.getIdParam(request);

    if (authenticatedRequest.user?.role === "branch_admin") {
      const order = await this.orderService.adminGetOrderById(orderId);
      const userBranchId = authenticatedRequest.user.branchId;
      const orderBranchId = order.branchSnapshot?.branchId || order.branchId;
      if (!userBranchId || (orderBranchId && orderBranchId.toString() !== userBranchId.toString())) {
        throw new AppError(
          "Access denied: You cannot modify orders from another branch.",
          HTTP_STATUS.FORBIDDEN,
          [],
          true,
          APP_ERROR_CODES.AUTHORIZATION_FAILED,
        );
      }
    }

    const order = await this.orderService.adminUpdateOrderStatus(
      orderId,
      request.body as UpdateOrderStatusDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: "Order status updated successfully.",
      data: { order },
    });
  };

  public adminUpdateReadyTime = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as Partial<AuthenticatedRequest>;
    const orderId = this.getIdParam(request);

    if (authenticatedRequest.user?.role === "branch_admin") {
      const order = await this.orderService.adminGetOrderById(orderId);
      const userBranchId = authenticatedRequest.user.branchId;
      const orderBranchId = order.branchSnapshot?.branchId || order.branchId;
      if (!userBranchId || (orderBranchId && orderBranchId.toString() !== userBranchId.toString())) {
        throw new AppError(
          "Access denied: You cannot modify orders from another branch.",
          HTTP_STATUS.FORBIDDEN,
          [],
          true,
          APP_ERROR_CODES.AUTHORIZATION_FAILED,
        );
      }
    }

    const order = await this.orderService.adminUpdateReadyTime(
      orderId,
      request.body as UpdateReadyTimeDto,
    );

    return sendSuccess(response, {
      message: "Estimated ready time updated successfully.",
      data: { order },
    });
  };

  private createAuthContext(request: Request): RequestContext {
    const context = createRequestContext(request);
    const authenticatedRequest = request as AuthenticatedRequest;

    return {
      ...context,
      userId: authenticatedRequest.user.id,
      userRole: authenticatedRequest.user.role,
    };
  }

  private getIdParam(request: Request): string {
    const id = request.params.id;

    if (typeof id !== "string") {
      throw new Error("Validated order id parameter is missing.");
    }

    return id;
  }
}
