import { Router } from "express";

import { requireAuth, requireRoles } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { UploadController } from "../controller/index.js";
import { uploadSingleFile } from "../middlewares/upload.middleware.js";
import { env } from "../../../config/env.js";
import { CloudinaryStorageProvider, LocalStorageProvider } from "../providers/index.js";
import { MediaRepository } from "../repository/index.js";
import { UploadService } from "../service/index.js";
import {
  listMediaQuerySchema,
  mediaIdParamSchema,
  uploadMediaBodySchema,
} from "../validators/index.js";

export const uploadRouter = Router();

const mediaRepository = new MediaRepository();
const storageProvider =
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
    ? new CloudinaryStorageProvider()
    : new LocalStorageProvider();
const uploadService = new UploadService(mediaRepository, storageProvider);
const uploadController = new UploadController(uploadService);
const ownerOnly = [requireAuth, requireRoles(["admin"])] as const;

uploadRouter.post(
  "/upload",
  ...ownerOnly,
  uploadSingleFile,
  validateRequest({ body: uploadMediaBodySchema }),
  asyncHandler(uploadController.upload),
);

uploadRouter.post(
  "/",
  ...ownerOnly,
  uploadSingleFile,
  validateRequest({ body: uploadMediaBodySchema }),
  asyncHandler(uploadController.upload),
);

uploadRouter.get(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: mediaIdParamSchema }),
  asyncHandler(uploadController.getById),
);

uploadRouter.delete(
  "/:id",
  ...ownerOnly,
  validateRequest({ params: mediaIdParamSchema }),
  asyncHandler(uploadController.delete),
);

uploadRouter.get(
  "/",
  ...ownerOnly,
  validateRequest({ query: listMediaQuerySchema }),
  asyncHandler(uploadController.list),
);
