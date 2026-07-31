import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { createRequestContext } from "../../../shared/utils/request-context.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import { PRODUCT_RESPONSE_MESSAGES } from "../constants/index.js";
import type {
  CreateProductDto,
  UpdateAvailabilityDto,
  UpdateInventoryDto,
  UpdatePricingDto,
  UpdateProductDto,
} from "../dto/index.js";
import type { ProductService } from "../service/index.js";
import type { PublicProductQueryDto } from "../types/index.js";

export class ProductController {
  public constructor(private readonly productService: ProductService) {}

  public create = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const product = await this.productService.createProduct(
      request.body as CreateProductDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: PRODUCT_RESPONSE_MESSAGES.CREATED,
      data: { product },
    });
  };

  public update = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const product = await this.productService.updateProduct(
      this.getParam(request, "id"),
      request.body as UpdateProductDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.UPDATED,
      data: { product },
    });
  };

  public updatePricing = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const product = await this.productService.updatePricing(
      this.getParam(request, "id"),
      request.body as UpdatePricingDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.PRICING_UPDATED,
      data: { product },
    });
  };

  public updateInventory = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const inventory = await this.productService.updateInventory(
      this.getParam(request, "id"),
      request.body as UpdateInventoryDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.INVENTORY_UPDATED,
      data: { inventory },
    });
  };

  public updateAvailability = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const product = await this.productService.updateAvailability(
      this.getParam(request, "id"),
      request.body as UpdateAvailabilityDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.AVAILABILITY_UPDATED,
      data: { product },
    });
  };

  public getInventory = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const inventory = await this.productService.getInventory(
      this.getParam(request, "id"),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.FETCHED,
      data: { inventory },
    });
  };

  public softDelete = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const product = await this.productService.deleteProduct(
      this.getParam(request, "id"),
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.DELETED,
      data: { product },
    });
  };

  public restore = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const product = await this.productService.restoreProduct(
      this.getParam(request, "id"),
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.RESTORED,
      data: { product },
    });
  };

  public getById = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const product = await this.productService.getProduct(
      this.getParam(request, "id"),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.FETCHED,
      data: { product },
    });
  };

  public listAdmin = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const products = await this.productService.listAdminProducts();

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.LISTED,
      data: { products },
    });
  };

  public listPublicCatalog = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.productService.queryPublicCatalog(
      request.query as PublicProductQueryDto,
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.LISTED,
      data: result,
    });
  };

  public listFeatured = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.productService.listFeaturedProducts(
      request.query as PublicProductQueryDto,
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.LISTED,
      data: result,
    });
  };

  public listTrending = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.productService.listTrendingProducts(
      request.query as PublicProductQueryDto,
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.LISTED,
      data: result,
    });
  };

  public listRecommended = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.productService.listRecommendedProducts(
      request.query as PublicProductQueryDto,
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.LISTED,
      data: result,
    });
  };

  public listSeasonal = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.productService.listSeasonalProducts(
      request.query as PublicProductQueryDto,
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.LISTED,
      data: result,
    });
  };

  public getPublicBySlug = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const product = await this.productService.getPublicProductBySlug(
      this.getParam(request, "slug"),
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.FETCHED,
      data: { product },
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

  private getParam(request: Request, name: string): string {
    const value = request.params[name];

    if (typeof value !== "string") {
      throw new Error(`Validated ${name} parameter is missing.`);
    }

    return value;
  }
}
