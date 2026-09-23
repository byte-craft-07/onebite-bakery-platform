import multer from "multer";

import { DEFAULT_MAX_FILE_SIZE_BYTES } from "../service/upload.service.js";

const storage = multer.memoryStorage();

export const uploadSingleFile = multer({
  storage,
  limits: {
    fileSize: DEFAULT_MAX_FILE_SIZE_BYTES,
    files: 1,
    fields: 10,
    parts: 12,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
  },
}).single("file");
