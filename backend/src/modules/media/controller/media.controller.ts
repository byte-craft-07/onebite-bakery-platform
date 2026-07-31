import type { Request, Response } from "express";

import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { AuthenticatedRequest } from "../../auth/index.js";
import type { UploadMediaDto } from "../dto/index.js";
import type { ExpressUploadedFile, MediaService } from "../service/index.js";

export class MediaController {
  public constructor(private readonly mediaService: MediaService) {}

  public uploadMedia = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const file = request.file as unknown as ExpressUploadedFile;

    if (!file) {
      throw new AppError(
        "Upload failed. File payload is missing.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.MEDIA_FILE_REQUIRED,
      );
    }

    const media = await this.mediaService.uploadMedia(
      file,
      request.body as UploadMediaDto,
      authenticatedRequest.user.id,
      authenticatedRequest.user.role,
    );

    return sendSuccess(response, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Media uploaded successfully.",
      data: { media },
    });
  };

  public getMediaById = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const mediaId = this.getIdParam(request);
    const media = await this.mediaService.getMediaById(mediaId);

    return sendSuccess(response, {
      message: "Media record retrieved successfully.",
      data: { media },
    });
  };

  public deleteMedia = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    const mediaId = this.getIdParam(request);

    const result = await this.mediaService.deleteMedia(
      mediaId,
      authenticatedRequest.user.id,
      authenticatedRequest.user.role,
    );

    return sendSuccess(response, {
      message: result.message,
      data: result,
    });
  };

  private getIdParam(request: Request): string {
    const id = request.params.id;

    if (typeof id !== "string") {
      throw new Error("Validated media id parameter is missing.");
    }

    return id;
  }
}
