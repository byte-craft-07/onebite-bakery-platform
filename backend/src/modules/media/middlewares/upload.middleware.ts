import multer from "multer";

const storage = multer.memoryStorage();

export const mediaUploadSingle = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max overall memory limit
  },
}).single("file");
