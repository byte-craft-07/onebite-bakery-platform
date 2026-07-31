import multer from "multer";

import { DEFAULT_MAX_FILE_SIZE_BYTES } from "../service/upload.service.js";

const storage = multer.memoryStorage();

export const uploadSingleFile = multer({
  storage,
  limits: {
    fileSize: DEFAULT_MAX_FILE_SIZE_BYTES,
  },
}).single("file");
