import React, { useState } from "react";
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { adminCatalogService } from "../services/adminCatalog.service";

export interface MediaUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  entityType?: "PRODUCT" | "CATEGORY" | "OCCASION";
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value,
  onChange,
  entityType = "PRODUCT",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await adminCatalogService.uploadMedia(file, entityType);
      onChange(url);
    } catch (err: any) {
      setUploadError(err?.response?.data?.error?.message || "Image upload failed. Fallback to image URL.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]">
        Media Image:
      </label>

      {value ? (
        <div className="relative aspect-4/3 w-full max-w-xs rounded-2xl overflow-hidden border border-[#E8E2D9] group bg-white shadow-xs">
          <img src={value} alt="Media Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
              title="Remove Image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#E8E2D9] rounded-2xl p-6 text-center space-y-3 bg-white hover:border-[#E67E22] transition-colors">
          {isUploading ? (
            <div className="space-y-2 py-4">
              <Loader2 className="h-8 w-8 text-[#E67E22] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#6E5D4F]">Uploading Image to Media Repository...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#2C1E16]">Click to upload or drag image file</p>
                <p className="text-[11px] text-gray-400">PNG, JPG, WEBP up to 5MB</p>
              </div>
              <label className="inline-block px-4 py-2 rounded-xl bg-[#FFF3E6] text-[#E67E22] text-xs font-bold cursor-pointer hover:bg-[#E67E22] hover:text-white transition-colors">
                <span>Browse Local Files</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </>
          )}
        </div>
      )}

      {uploadError ? (
        <p className="text-xs text-red-600 font-semibold">{uploadError}</p>
      ) : null}

      <div className="pt-1">
        <input
          type="url"
          placeholder="Or paste direct image URL (e.g. https://...)"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-[#E8E2D9] text-xs outline-none focus:border-[#E67E22]"
        />
      </div>
    </div>
  );
};
