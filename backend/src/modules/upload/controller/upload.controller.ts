import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { createRequestContext } from "../../../shared/utils/request-context.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type { ListMediaFilterDto, UploadMediaBodyDto } from "../dto/index.js";
import type { UploadService } from "../service/index.js";

export class UploadController {
  public constructor(private readonly uploadService: UploadService) {}

  public upload = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const media = await this.uploadService.uploadMedia(
      request.file,
      request.body as UploadMediaBodyDto,
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Media file uploaded successfully.",
      data: { media },
    });
  };

  public getById = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const media = await this.uploadService.getMedia(this.getIdParam(request));

    return sendSuccess(response, {
      message: "Media record fetched successfully.",
      data: { media },
    });
  };

  public delete = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const media = await this.uploadService.deleteMedia(
      this.getIdParam(request),
      this.createAuthContext(request),
    );

    return sendSuccess(response, {
      message: "Media file deleted successfully.",
      data: { media },
    });
  };

  public list = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.uploadService.listMedia(
      request.query as ListMediaFilterDto,
    );

    return sendSuccess(response, {
      message: "Media list fetched successfully.",
      data: result,
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
      throw new Error("Validated media id parameter is missing.");
    }

    return id;
  }
}
