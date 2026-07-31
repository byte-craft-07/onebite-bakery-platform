export interface UploadMediaBodyDto {
  altText?: string;
  tags?: string[];
}

export interface ListMediaFilterDto {
  page?: number;
  limit?: number;
  mimeType?: string;
  tag?: string;
}
