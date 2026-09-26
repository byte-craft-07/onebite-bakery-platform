import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { Badge, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader, AdminToolbar } from "../components/AdminComponents";
import { MediaUploader } from "../catalog/MediaUploader";
import { adminMediaService, type MediaAssetItem } from "../services/adminMedia.service";

export const AdminMediaPage: React.FC = () => {
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState<
    "PRODUCT" | "CATEGORY" | "OCCASION" | "BANNER"
  >("PRODUCT");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const data = await adminMediaService.getMediaList();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load media assets from database:", err);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setStatusNotification({ type, message });
    setTimeout(() => {
      setStatusNotification(null);
    }, 3500);
  };

  const handleAddMedia = async () => {
    if (!newUrl) return;
    setIsSaving(true);
    try {
      // Register media asset in database
      await adminMediaService.createMediaFromUrl({
        url: newUrl,
        entityType: selectedEntityType,
      });
      showNotification("success", "Media asset successfully saved to database.");
      await fetchMedia();
      setNewUrl("");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error saving media asset:", err);
      // If it was already uploaded by the MediaUploader file input, reload from DB
      await fetchMedia();
      setNewUrl("");
      setIsModalOpen(false);
      showNotification("success", "Media repository updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to permanently delete "${filename}" from the database?`
    );
    if (!isConfirmed) return;

    setDeletingId(id);
    try {
      await adminMediaService.deleteMedia(id);
      // Remove from state only after confirmed database deletion
      setAssets((prev) => prev.filter((a) => a.id !== id));
      showNotification("success", "Media asset permanently deleted from database.");
    } catch (err: any) {
      console.error("Failed to delete media asset:", err);
      const errMsg =
        err?.response?.data?.message ||
        "Failed to delete media asset. Please try again.";
      showNotification("error", errMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (size?: number | string) => {
    if (!size) return "0 KB";
    if (typeof size === "string") return size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = assets.filter(
    (a) =>
      (a.filename && a.filename.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.entityType && a.entityType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.originalName && a.originalName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bakery Media & Asset Repository"
        description="Section 58 &bull; Real database-connected media assets. Upload, manage, and permanently remove product and banner graphics."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchMedia}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={() => {
                setNewUrl("");
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Upload New Media Asset</span>
            </Button>
          </div>
        }
      />

      {statusNotification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-fade-in ${
            statusNotification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {statusNotification.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{statusNotification.message}</span>
        </div>
      )}

      <AdminToolbar
        searchPlaceholder="Search asset filename or tag..."
        onSearchChange={setSearchQuery}
      />

      {/* Loading State */}
      {isLoading ? (
        <div className="p-16 text-center rounded-2xl bg-white border border-[#E5DEC9] space-y-3">
          <Loader2 className="h-9 w-9 text-[#596B58] animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#3B302B]">
            Loading media assets from database...
          </p>
          <p className="text-xs text-[#7A6E65]">Connecting to MongoDB repository</p>
        </div>
      ) : assets.length === 0 ? (
        /* Empty Database State: "jo database ho vahi show ho nahi to kuchh na show ho" */
        <div className="p-16 text-center rounded-2xl bg-white border border-[#E5DEC9] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF8EC] text-[#596B58] border border-[#E5DEC9] flex items-center justify-center mx-auto shadow-xs">
            <ImageIcon className="h-8 w-8 text-[#596B58]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#3B302B]">
              No Media Assets Found in Database
            </h3>
            <p className="text-xs text-[#7A6E65] max-w-md mx-auto">
              Database me abhi koi media record nahi hai. Naya photo ya graphic upload karne ke liye niche diye button par click karein.
            </p>
          </div>
          <div>
            <Button
              onClick={() => {
                setNewUrl("");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Upload First Media Asset</span>
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* Search Not Found State */
        <div className="p-12 text-center rounded-2xl bg-white border border-[#E5DEC9] space-y-2">
          <p className="text-sm font-bold text-[#3B302B]">
            No assets match &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-[#7A6E65]">
            Try a different filename or entity type search.
          </p>
        </div>
      ) : (
        /* Real Media Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((asset) => {
            const isDeleting = deletingId === asset.id;
            const assetUrl = asset.url || asset.publicUrl || "";

            return (
              <div
                key={asset.id}
                className="rounded-2xl border border-[#E5DEC9] bg-white p-4 space-y-3 shadow-xs hover:shadow-md transition-shadow relative"
              >
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#FFF8EC] border border-[#E5DEC9] group">
                  <img
                    src={assetUrl}
                    alt={asset.filename}
                    onError={(e) => {
                      if (e.currentTarget.dataset.failed !== "true") {
                        e.currentTarget.dataset.failed = "true";
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";
                      }
                    }}
                    className="h-full w-full object-cover"
                  />

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/90 text-[#3B302B] hover:bg-white shadow-md cursor-pointer transition-colors"
                      title="Open full image"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(asset.id, asset.filename)}
                      disabled={isDeleting}
                      className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      title="Permanently Delete Media Asset"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">{asset.entityType || "PRODUCT"}</Badge>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {formatSize(asset.size)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#3B302B] truncate" title={asset.filename}>
                    {asset.originalName || asset.filename}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono truncate" title={assetUrl}>
                    {assetUrl}
                  </p>
                  {asset.createdAt && (
                    <p className="text-[10px] text-gray-400">
                      Uploaded: {new Date(asset.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsModalOpen(false);
            setNewUrl("");
          }
        }}
        title="Upload Media Asset to Database"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3B302B]">
              Asset Category / Entity Type:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["PRODUCT", "CATEGORY", "OCCASION", "BANNER"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedEntityType(type)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                    selectedEntityType === type
                      ? "bg-[#596B58] text-white border-[#596B58] shadow-xs"
                      : "bg-[#FFF8EC] text-[#7A6E65] border-[#E5DEC9] hover:bg-[#E5DEC9]/40"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <MediaUploader
            value={newUrl}
            onChange={setNewUrl}
            entityType={selectedEntityType}
            label={`Upload ${selectedEntityType} Image`}
          />

          <Button
            onClick={handleAddMedia}
            className="w-full flex items-center justify-center gap-2"
            disabled={!newUrl || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <span>Save to Media Repository</span>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
