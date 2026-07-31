import type { MediaEntityType } from "../constants/index.js";

export interface UploadMediaDto {
  entityType: MediaEntityType;
  entityId?: string;
}

export interface ReplaceMediaDto {
  entityType?: MediaEntityType;
  entityId?: string;
}
