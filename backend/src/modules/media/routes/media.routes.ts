import { Router } from "express";

import { requireAuth } from "../../auth/index.js";
import { validateRequest } from "../../../shared/middlewares/validate-request.middleware.js";
import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { MediaController } from "../controller/index.js";
import { mediaUploadSingle } from "../middlewares/upload.middleware.js";
import { MediaRepository } from "../repository/index.js";
import { MediaService } from "../service/index.js";
import {
  mediaIdParamSchema,
  uploadMediaBodySchema,
} from "../validators/index.js";

export const mediaRouter = Router();

const mediaRepository = new MediaRepository();
const mediaService = new MediaService(mediaRepository);
const mediaController = new MediaController(mediaService);

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
