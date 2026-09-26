import { apiClient } from "@/services/api.client";

export interface MediaAssetItem {
  id: string;
  filename: string;
  originalName?: string;
  url: string;
  publicUrl?: string;
  entityType: string;
  size?: number | string;
  mimeType?: string;
  storageProvider?: string;
  createdAt: string;
}

export const adminMediaService = {
  getMediaList: async (params?: { search?: string; entityType?: string }): Promise<MediaAssetItem[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.entityType) query.append("entityType", params.entityType);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<{
      success: boolean;
      data: { media: MediaAssetItem[]; total: number };
    }>(`/media${qs}`);

    return response.data?.data?.media || [];
  },

  createMediaFromUrl: async (payload: {
    url: string;
    entityType?: string;
    filename?: string;
    originalName?: string;
  }): Promise<MediaAssetItem> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { media: MediaAssetItem };
    }>("/media", payload);

    return response.data.data.media;
  },

  uploadMediaFile: async (file: File, entityType = "PRODUCT"): Promise<MediaAssetItem> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);

    const response = await apiClient.post<{
      success: boolean;
      data: { media: MediaAssetItem };
    }>("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.data.media;
  },

  deleteMedia: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/media/${id}`);

    return response.data?.success ?? true;
  },
};
