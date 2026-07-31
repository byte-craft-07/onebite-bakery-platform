import type { Request, Response } from "express";

import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type { AddCartItemDto, MergeCartDto, UpdateCartItemDto } from "../dto/index.js";
import type { CartService } from "../service/index.js";

export class CartController {
  public constructor(private readonly cartService: CartService) {}

  public getCart = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const { customerId, sessionId } = this.extractCartIdentifiers(request);
    const cart = await this.cartService.getCart(customerId, sessionId);

    return sendSuccess(response, {
      message: "Cart fetched successfully.",
      data: { cart },
    });
  };

  public addItem = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const { customerId, sessionId } = this.extractCartIdentifiers(request);
    const cart = await this.cartService.addItem(
      customerId,
      sessionId,
      request.body as AddCartItemDto,
    );

    return sendSuccess(response, {
      message: "Item added to cart successfully.",
      data: { cart },
    });
  };

  public updateItem = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const { customerId, sessionId } = this.extractCartIdentifiers(request);
    const itemId = this.getParam(request, "itemId");
    const cart = await this.cartService.updateItem(
      customerId,
      sessionId,
      itemId,
      request.body as UpdateCartItemDto,
    );

    return sendSuccess(response, {
      message: "Cart item updated successfully.",
      data: { cart },
    });
  };

  public removeItem = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const { customerId, sessionId } = this.extractCartIdentifiers(request);
    const itemId = this.getParam(request, "itemId");
    const cart = await this.cartService.removeItem(customerId, sessionId, itemId);

    return sendSuccess(response, {
      message: "Item removed from cart successfully.",
      data: { cart },
    });
  };

  public clearCart = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const { customerId, sessionId } = this.extractCartIdentifiers(request);
    const cart = await this.cartService.clearCart(customerId, sessionId);

    return sendSuccess(response, {
      message: "Cart cleared successfully.",
      data: { cart },
    });
  };

  public mergeCart = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const customerId = authenticatedRequest.user.id;
    const body = request.body as MergeCartDto;

    const cart = await this.cartService.mergeCart(customerId, body.sessionId);

    return sendSuccess(response, {
      message: "Cart merged successfully.",
      data: { cart },
    });
  };

  public getCustomerCartByAdmin = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const customerId = this.getParam(request, "customerId");
    const cart = await this.cartService.getCustomerCartByAdmin(customerId);

    return sendSuccess(response, {
      message: "Customer cart fetched successfully.",
      data: { cart },
    });
  };

  public clearCustomerCartByAdmin = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const customerId = this.getParam(request, "customerId");
    const cart = await this.cartService.clearCustomerCartByAdmin(customerId);

    return sendSuccess(response, {
      message: "Customer cart cleared successfully.",
      data: { cart },
    });
  };

  private extractCartIdentifiers(request: Request): {
    customerId?: string;
    sessionId?: string;
  } {
    const authenticatedRequest = request as Partial<AuthenticatedRequest>;
    const customerId = authenticatedRequest.user?.id;

    const headerSession = request.headers["x-session-id"];
    const querySession = request.query.sessionId;
    const bodySession = (request.body as { sessionId?: string })?.sessionId;

    let sessionId: string | undefined;

    if (typeof headerSession === "string" && headerSession.trim()) {
      sessionId = headerSession.trim();
    } else if (typeof querySession === "string" && querySession.trim()) {
      sessionId = querySession.trim();
    } else if (typeof bodySession === "string" && bodySession.trim()) {
      sessionId = bodySession.trim();
    }

    return { customerId, sessionId };
  }

  private getParam(request: Request, paramName: string): string {
    const value = request.params[paramName];
    if (typeof value !== "string") {
      throw new Error(`Validated ${paramName} parameter is missing.`);
    }
    return value;
  }
}
