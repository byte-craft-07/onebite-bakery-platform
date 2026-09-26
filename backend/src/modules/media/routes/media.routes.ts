import { Router } from "express";

import { requireAuth } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { MediaController } from "../controller/index.js";
import { mediaUploadSingle } from "../middlewares/upload.middleware.js";
import { MediaRepository } from "../repository/index.js";
import { MediaService } from "../service/index.js";
import { env } from "../../../config/env.js";
import { CloudinaryStorageProvider, LocalStorageProvider } from "../storage/index.js";
import {
  mediaIdParamSchema,
  uploadMediaBodySchema,
} from "../validators/index.js";

export const mediaRouter = Router();

const mediaRepository = new MediaRepository();
const storageProvider =
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
    ? new CloudinaryStorageProvider()
    : new LocalStorageProvider();
const mediaService = new MediaService(mediaRepository, storageProvider);
const mediaController = new MediaController(mediaService);

mediaRouter.get(
  "/",
  requireAuth,
  asyncHandler(mediaController.listMedia),
);

mediaRouter.post(
  "/",
  requireAuth,
  asyncHandler(mediaController.createMedia),
);

mediaRouter.post(
  "/upload",
  requireAuth,
  mediaUploadSingle,
  validateRequest({ body: uploadMediaBodySchema }),
  asyncHandler(mediaController.uploadMedia),
);

mediaRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: mediaIdParamSchema }),
  asyncHandler(mediaController.getMediaById),
);

mediaRouter.delete(
  "/:id",
  requireAuth,
  validateRequest({ params: mediaIdParamSchema }),
  asyncHandler(mediaController.deleteMedia),
);
