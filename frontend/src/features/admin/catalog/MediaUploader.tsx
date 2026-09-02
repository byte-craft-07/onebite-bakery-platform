import React, { useState } from "react";
import { Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

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

  const processFileLocal = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          onChange(compressedDataUrl);
        } else {
          onChange(src);
        }
      };
      img.onerror = () => onChange(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  };


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const url = await adminCatalogService.uploadMedia(file, entityType);
      if (url) {
        onChange(url);
        return;
      }
    } catch (_err) {
      // Ignore API failure and fallback to FileReader Data URL
    } finally {
      setIsUploading(false);
    }

    // Direct local file conversion to base64 Data URL
    processFileLocal(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-[#3B302B]">
        Media Image:
      </label>

      {value ? (
        <div className="relative aspect-4/3 w-full max-w-xs rounded-2xl overflow-hidden border border-[#E5DEC9] group bg-white shadow-xs">
          <img src={value} alt="Media Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md cursor-pointer"
              title="Remove Image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#E5DEC9] rounded-2xl p-6 text-center space-y-3 bg-white hover:border-[#596B58] transition-colors">
          {isUploading ? (
            <div className="space-y-2 py-4">
              <Loader2 className="h-8 w-8 text-[#596B58] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#7A6E65]">Processing Image File...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#3B302B]">Click to upload or drag image file</p>
                <p className="text-[11px] text-gray-400">PNG, JPG, WEBP up to 5MB</p>
              </div>
              <label className="inline-block px-4 py-2 rounded-xl bg-[#FFF8EC] text-[#596B58] text-xs font-bold cursor-pointer hover:bg-[#596B58] hover:text-white transition-colors">
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
          className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
        />
      </div>
    </div>
  );
};
