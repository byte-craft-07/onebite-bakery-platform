import type { Request, Response } from "express";

import { sendSuccess } from "../../../shared/responses/api-response.js";
import { PRODUCT_RESPONSE_MESSAGES } from "../../product/constants/index.js";
import { ProductRepository } from "../../product/repository/index.js";
import { ProductService } from "../../product/service/index.js";
import type { PublicProductQueryDto } from "../../product/types/index.js";
import type { OccasionService } from "../service/occasion.service.js";

export class OccasionController {
  private _productService?: ProductService;

  public constructor(
    private readonly occasionService: OccasionService,
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

  public listPublic = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const occasions = await this.occasionService.listPublicOccasions();

    return sendSuccess(response, {
      message: "Occasions fetched successfully.",
      data: { occasions },
    });
  };

  public getBySlug = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const slug = request.params.slug;
    if (typeof slug !== "string") {
      throw new Error("Validated slug parameter is missing.");
    }

    const occasion = await this.occasionService.getPublicOccasionBySlug(slug);

    return sendSuccess(response, {
      message: "Occasion fetched successfully.",
      data: { occasion },
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

    const result = await this.productService.listProductsByOccasionSlug(
      slug,
      request.query as PublicProductQueryDto,
    );

    return sendSuccess(response, {
      message: PRODUCT_RESPONSE_MESSAGES.LISTED,
      data: result,
    });
  };

  public listAdmin = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const occasions = await this.occasionService.listAdminOccasions();
    return sendSuccess(response, {
      message: "Admin occasions fetched successfully.",
      data: { occasions },
    });
  };

  public create = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const occasion = await this.occasionService.createOccasion(request.body);
    return sendSuccess(response, {
      message: "Occasion created successfully.",
      data: { occasion },
    });
  };

  public update = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const id = request.params.id;
    if (typeof id !== "string") {
      throw new Error("Validated id parameter is missing.");
    }
    const occasion = await this.occasionService.updateOccasion(id, request.body);
    return sendSuccess(response, {
      message: "Occasion updated successfully.",
      data: { occasion },
    });
  };

  public softDelete = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const id = request.params.id;
    if (typeof id !== "string") {
      throw new Error("Validated id parameter is missing.");
    }
    const occasion = await this.occasionService.softDeleteOccasion(id);
    return sendSuccess(response, {
      message: "Occasion deleted successfully.",
      data: { occasion },
    });
  };
}
