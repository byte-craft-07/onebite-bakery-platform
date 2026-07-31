import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { createRequestContext } from "../../../shared/utils/request-context.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import { PRODUCT_RESPONSE_MESSAGES } from "../../product/constants/index.js";
import { ProductRepository } from "../../product/repository/index.js";
import { ProductService } from "../../product/service/index.js";
import type { PublicProductQueryDto } from "../../product/types/index.js";
import { CATEGORY_RESPONSE_MESSAGES } from "../constants/index.js";
import type {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from "../dto/index.js";
import type { CategoryService } from "../service/index.js";

export class CategoryController {
  private _productService?: ProductService;

  public constructor(
    private readonly categoryService: CategoryService,
    productService?: ProductService,
  ) {
    this._productService = productService;
  }

  private get productService(): ProductService {
    if (!this._productService) {
      this._productService = new ProductService(new ProductRepository());
    }
    return this._productService;
  }

  public create = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const category = await this.categoryService.createCategory(
      request.body as CreateCategoryDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: CATEGORY_RESPONSE_MESSAGES.CREATED,
      data: { category },
    });
  };

  public update = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const category = await this.categoryService.updateCategory(
      this.getIdParam(request),
      request.body as UpdateCategoryDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: CATEGORY_RESPONSE_MESSAGES.UPDATED,
      data: { category },
    });
  };

  public softDelete = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const category = await this.categoryService.deleteCategory(
      this.getIdParam(request),
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: CATEGORY_RESPONSE_MESSAGES.DELETED,
      data: { category },
    });
  };

  public restore = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const category = await this.categoryService.restoreCategory(
      this.getIdParam(request),
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: CATEGORY_RESPONSE_MESSAGES.RESTORED,
      data: { category },
    });
  };

  public getById = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const category = await this.categoryService.getCategory(
      this.getIdParam(request),
    );

    return sendSuccess(response, {
      message: CATEGORY_RESPONSE_MESSAGES.FETCHED,
      data: { category },
    });
  };

  public listAdmin = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const categories = await this.categoryService.listAdminCategories();

    return sendSuccess(response, {
      message: CATEGORY_RESPONSE_MESSAGES.LISTED,
      data: { categories },
    });
  };

  public listPublic = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const categories = await this.categoryService.listPublicCategoryTree();

    return sendSuccess(response, {
      message: CATEGORY_RESPONSE_MESSAGES.LISTED,
      data: { categories },
    });
  };

  public listProductsBySlug = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const slug = request.params.slug;

    if (typeof slug !== "string") {
      throw new Error("Validated slug parameter is missing.");
    }

    const result = await this.productService.listProductsByCategorySlug(
      slug,
      request.query as PublicProductQueryDto,
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.LISTED,
      data: result,
    });
  };

  public reorder = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const categories = await this.categoryService.reorderCategories(
      request.body as ReorderCategoriesDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: CATEGORY_RESPONSE_MESSAGES.REORDERED,
      data: { categories },
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
      throw new Error("Validated category id parameter is missing.");
    }

    return id;
  }
}
