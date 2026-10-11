import React, { useState, useRef } from "react";
import { Loader2, Trash2, UploadCloud, RefreshCw, Link as LinkIcon, Smartphone, Check, Plus } from "lucide-react";

import { adminCatalogService } from "../services/adminCatalog.service";

export interface MediaUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  entityType?: "PRODUCT" | "CATEGORY" | "OCCASION" | "BANNER";
  label?: string;
  multiple?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value,
  onChange,
  entityType = "PRODUCT",
  label = "Upload Photo / Image",
  multiple = false,
}) => {
  const [activeTab, setActiveTab] = useState<"DEVICE" | "URL">("DEVICE");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileLocal = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        if (!src) {
          resolve("");
          return;
        }

        const img = new Image();
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
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
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
            resolve(compressedDataUrl);
          } else {
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f && f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      setUploadError("Please select valid image file(s) (PNG, JPG, JPEG, WEBP, etc.)");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setLastUploadedName(
      fileArray.length === 1 ? fileArray[0].name : `${fileArray.length} photos selected`
    );

    try {
      for (const file of fileArray) {
        let uploadedUrl = "";
        try {
          const url = await adminCatalogService.uploadMedia(file, entityType);
          if (url) {
            uploadedUrl = url;
          }
        } catch (_err) {
          // Fallback to local compressed DataURL
        }

        if (!uploadedUrl) {
          uploadedUrl = await processFileLocal(file);
        }

        if (uploadedUrl) {
          onChange(uploadedUrl);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void handleUploadFiles(files);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      void handleUploadFiles(multiple ? files : [files[0]]);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlDraft("");
  };

  return (
    <div className="space-y-2.5 p-3 sm:p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9]">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-bold text-[#3B302B]">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#E5DEC9] w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("DEVICE")}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "DEVICE"
                ? "bg-[#596B58] text-white shadow-xs"
                : "text-[#7A6E65] hover:text-[#3B302B]"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload from Device</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("URL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "URL"
                ? "bg-[#596B58] text-white shadow-xs"
                : "text-[#7A6E65] hover:text-[#3B302B]"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Web URL</span>
          </button>
        </div>
      </div>

      {/* Hidden Native File Input (Always Available) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Image Preview If Selected (Single mode) */}
      {value ? (
        <div className="space-y-2 bg-white p-3 rounded-xl border border-[#E5DEC9]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative aspect-video sm:aspect-square w-full sm:w-28 rounded-xl overflow-hidden border border-[#E5DEC9] bg-[#FFF8EC] shrink-0">
              <img
                src={value}
                alt="Selected preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80";
                }}
              />
              <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Check className="h-2.5 w-2.5" /> Active
              </div>
            </div>

            <div className="flex-1 space-y-2 w-full">
              <div className="text-xs">
                <p className="font-bold text-[#3B302B]">Current Image Ready</p>
                <p className="text-[11px] text-[#7A6E65] truncate max-w-xs sm:max-w-md">
                  {lastUploadedName ? `File: ${lastUploadedName}` : value}
                </p>
              </div>

              {/* Action Buttons for Device Upload & Clear */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3.5 py-1.5 rounded-xl bg-[#596B58] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#495948] transition-colors cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>Change / Upload from Device</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setLastUploadedName(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mode 1: Upload from Device Tab Content */}
      {activeTab === "DEVICE" ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center space-y-2.5 transition-all cursor-pointer bg-white ${
            isDragging
              ? "border-[#596B58] bg-[#FFF8EC] scale-[1.01]"
              : "border-[#E5DEC9] hover:border-[#596B58] hover:bg-[#FFFDF9]"
          }`}
        >
          {isUploading ? (
            <div className="space-y-2 py-3">
              <Loader2 className="h-8 w-8 text-[#596B58] animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#3B302B]">
                Uploading image(s) from device...
              </p>
              <p className="text-[11px] text-[#7A6E65]">Optimizing and saving photo(s)</p>
            </div>
          ) : (
            <>
              <div className="w-11 h-11 rounded-2xl bg-[#FFF8EC] text-[#596B58] border border-[#E5DEC9] flex items-center justify-center mx-auto shadow-xs">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#3B302B]">
                  {multiple
                    ? "Click here to select 1 or multiple photos from Computer / Phone"
                    : "Click here to choose file from Computer / Phone"}
                </p>
                <p className="text-[11px] text-[#7A6E65]">
                  Or drag & drop photo(s) directly • Supports JPG, PNG, WEBP, GIF
                </p>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#596B58] text-white text-xs font-bold shadow-xs hover:bg-[#495948] transition-colors">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>{multiple ? "Select Photos (Multiple Allowed)" : "Select from Device Gallery"}</span>
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Mode 2: Direct Web URL Tab Content */
        <div className="space-y-1.5 bg-white p-3 rounded-xl border border-[#E5DEC9]">
          <label className="block text-[11px] font-bold text-[#7A6E65]">
            Paste Public Web Image URL (Unsplash, CDN, etc.):
          </label>
          {multiple ? (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or https://..."
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                className="flex-1 p-2.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-[#FFFDF9]"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-3.5 py-2 bg-[#596B58] text-white text-xs font-bold rounded-xl hover:bg-[#495948] flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add URL</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or https://..."
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-[#FFFDF9]"
              />
              {value ? (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-100"
                >
                  Clear
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      {uploadError ? (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {uploadError}
        </div>
      ) : null}
    </div>
  );
};
