import React, { useEffect, useState, useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  List,
  Loader2,
  Monitor,
  Plus,
  Power,
  RotateCw,
  Smartphone,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { Badge, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { AdminPageHeader, AdminTable } from "../components/AdminComponents";
import { adminBannerService, type BannerPayload } from "../services/adminBanner.service";
import { adminCatalogService } from "../services/adminCatalog.service";
import { type BannerItem } from "@/services/banner.service";

// Standard quick link targets
const PRESET_LINK_OPTIONS = [
  { label: "📦 All Products Listing (/products)", value: "/products", group: "Main Pages" },
  { label: "🎂 Custom Cake Designer Studio (/custom-cake)", value: "/custom-cake", group: "Main Pages" },
  { label: "🎁 Celebration Combos Shop (/combos)", value: "/combos", group: "Main Pages" },
  { label: "🎉 Party Shop & Decorations (/decorations)", value: "/decorations", group: "Main Pages" },
  { label: "🏷️ Offers & Deals Page (/offers)", value: "/offers", group: "Main Pages" },
  { label: "🍰 Artisanal Cakes Category (/categories/artisanal-cakes)", value: "/categories/artisanal-cakes", group: "Categories" },
  { label: "🥐 Pastries & Tarts (/categories/pastries-tarts)", value: "/categories/pastries-tarts", group: "Categories" },
  { label: "🍞 Fresh Bakery Breads (/categories/fresh-breads)", value: "/categories/fresh-breads", group: "Categories" },
  { label: "🍪 Cookies & Biscuits (/categories/cookies-biscuits)", value: "/categories/cookies-biscuits", group: "Categories" },
  { label: "✨ Birthday Specials (/occasions/birthdays)", value: "/occasions/birthdays", group: "Occasions" },
  { label: "💍 Anniversary Delights (/occasions/anniversaries)", value: "/occasions/anniversaries", group: "Occasions" },
  { label: "🔗 Custom URL / External Link", value: "CUSTOM", group: "Custom" },
];

// Sample poster image templates for quick fill
const SAMPLE_POSTERS = [
  {
    name: "🍫 Belgian Truffle Special",
    title: "Belgian Truffle Cake Celebration Poster",
    desktopImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1400&h=560&q=80",
    linkUrl: "/products",
  },
  {
    name: "🎂 Custom Designer Cakes",
    title: "Custom 3D & Tier Designer Cakes Studio",
    desktopImage: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=1400&h=560&q=80",
    linkUrl: "/custom-cake",
  },
  {
    name: "🍓 Fresh Fruit Delights",
    title: "Fresh Strawberry & Berry Delights Poster",
    desktopImage: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1400&h=560&q=80",
    linkUrl: "/categories/pastries-tarts",
  },
  {
    name: "🥐 European Bakery & Croissants",
    title: "Freshly Baked European Bakery Poster",
    desktopImage: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1400&h=560&q=80",
    linkUrl: "/categories/fresh-breads",
  },
  {
    name: "🎉 Party Shop & Combos",
    title: "Celebration Party Shop Poster",
    desktopImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&h=560&q=80",
    linkUrl: "/combos",
  },
];

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [previewBanner, setPreviewBanner] = useState<BannerItem | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Form Fields (Pure Poster Management)
  const [title, setTitle] = useState("");
  const [desktopImage, setDesktopImage] = useState("");
  const [mobileImage, setMobileImage] = useState("");
  
  // Link selector state
  const [selectedLinkType, setSelectedLinkType] = useState<string>("/products");
  const [customLinkUrl, setCustomLinkUrl] = useState<string>("");

  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Upload status
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  const [desktopUploadError, setDesktopUploadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const desktopFileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchBanners = async () => {
    try {
      const list = await adminBannerService.getBanners();
      setBanners(list);
    } catch (_err) {
      setBanners([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await adminCatalogService.getCategories();
      setCategories(cats);
    } catch (_err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setTitle("");
    setDesktopImage("");
    setMobileImage("");
    setSelectedLinkType("/products");
    setCustomLinkUrl("");
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setErrorMsg(null);
    setDesktopUploadError(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BannerItem) => {
    setEditingBanner(b);
    setTitle(b.title || "");
    setDesktopImage(b.desktopImage || "");
    setMobileImage(b.mobileImage || "");

    const matched = PRESET_LINK_OPTIONS.find((opt) => opt.value === b.linkUrl);
    if (matched && matched.value !== "CUSTOM") {
      setSelectedLinkType(matched.value);
      setCustomLinkUrl("");
    } else {
      setSelectedLinkType("CUSTOM");
      setCustomLinkUrl(b.linkUrl || "");
    }

    setDisplayOrder(b.displayOrder ?? 1);
    setIsActive(b.isActive ?? true);
    setErrorMsg(null);
    setDesktopUploadError(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof SAMPLE_POSTERS[0]) => {
    setTitle(preset.title);
    setDesktopImage(preset.desktopImage);
    const matched = PRESET_LINK_OPTIONS.find((opt) => opt.value === preset.linkUrl);
    if (matched) {
      setSelectedLinkType(matched.value);
      setCustomLinkUrl("");
    } else {
      setSelectedLinkType("CUSTOM");
      setCustomLinkUrl(preset.linkUrl);
    }
  };

  // Image Upload Processor (File -> Compressed Base64 / Backend Server Upload)
  const processImageFile = async (
    file: File,
    isMobile: boolean = false
  ): Promise<void> => {
    const setUploading = isMobile ? setIsUploadingMobile : setIsUploadingDesktop;
    const setImage = isMobile ? setMobileImage : setDesktopImage;

    setUploading(true);
    setDesktopUploadError(null);

    // Try backend upload first
    try {
      const serverUrl = await adminCatalogService.uploadMedia(file, "PRODUCT");
      if (serverUrl) {
        setImage(serverUrl);
        setUploading(false);
        return;
      }
    } catch (_err) {
      // Fallback to local Data URL
    }

    // High quality client side image processing & compression
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        setUploading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxWidth = isMobile ? 800 : 1600;
        const maxHeight = isMobile ? 600 : 900;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
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
          const compressed = canvas.toDataURL("image/jpeg", 0.88);
          setImage(compressed);
        } else {
          setImage(src);
        }
        setUploading(false);
      };
      img.onerror = () => {
        setImage(src);
        setUploading(false);
      };
      img.src = src;
    };
    reader.onerror = () => {
      setDesktopUploadError("Failed to read image file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, false);
    }
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Poster Name / Title is required.");
      return;
    }
    if (!desktopImage.trim()) {
      setErrorMsg("Please upload or provide a Poster Image.");
      return;
    }

    const finalTargetUrl =
      selectedLinkType === "CUSTOM"
        ? customLinkUrl.trim() || "/products"
        : selectedLinkType;

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: BannerPayload = {
      title: title.trim(),
      desktopImage: desktopImage.trim(),
      mobileImage: mobileImage.trim() || undefined,
      linkUrl: finalTargetUrl,
      displayOrder: Number(displayOrder) || 1,
      isActive,
      placement: "home_hero",
    };

    try {
      if (editingBanner?.id) {
        await adminBannerService.updateBanner(editingBanner.id, payload);
      } else {
        await adminBannerService.createBanner(payload);
      }
      await fetchBanners();
      setIsModalOpen(false);
      setSuccessMsg("Poster saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save poster.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete poster "${name}"?`)) return;
    try {
      await adminBannerService.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setSuccessMsg("Poster deleted.");
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (_err) {
      // Fallback
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await adminBannerService.toggleStatus(id, !currentStatus);
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: updated.isActive } : b))
      );
    } catch (_err) {
      // Fallback
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === banners.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    setBanners(newBanners);
    const orderedIds = newBanners.map((b) => b.id);
    await adminBannerService.reorderBanners(orderedIds);
  };

  const filteredBanners = banners.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === "active") return b.isActive;
    if (filterStatus === "inactive") return !b.isActive;
    return true;
  });

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <AdminPageHeader
        title="Hero Poster Images (Auto-Changing)"
        description="Upload poster images and configure click redirects for the storefront hero carousel. Fully responsive on mobile & desktop."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBanners}
              className="flex items-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Poster Image</span>
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5DEC9] shadow-xs">
          <span className="text-xs font-medium text-[#7A6E65]">Total Posters</span>
          <p className="text-2xl font-bold text-[#3B302B] mt-1">{banners.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5DEC9] shadow-xs">
          <span className="text-xs font-medium text-emerald-600">Active in Carousel</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5DEC9] shadow-xs">
          <span className="text-xs font-medium text-amber-600">Inactive / Drafts</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{banners.length - activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5DEC9] shadow-xs">
          <span className="text-xs font-medium text-[#7A6E65]">Auto-Slide Interval</span>
          <p className="text-2xl font-bold text-[#596B58] mt-1">4.0s</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5DEC9] shadow-xs">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search posters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center rounded-lg border border-[#E5DEC9] bg-[#FFF8EC] p-1 text-xs">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === "all" ? "bg-[#3B302B] text-white" : "text-[#7A6E65] hover:text-[#3B302B]"
              }`}
            >
              All ({banners.length})
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === "active" ? "bg-emerald-600 text-white" : "text-[#7A6E65] hover:text-emerald-700"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus("inactive")}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterStatus === "inactive" ? "bg-amber-600 text-white" : "text-[#7A6E65] hover:text-amber-700"
              }`}
            >
              Drafts ({banners.length - activeCount})
            </button>
          </div>

          {/* View Switcher */}
          <div className="flex items-center rounded-lg border border-[#E5DEC9] bg-[#FFF8EC] p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md ${
                viewMode === "grid" ? "bg-[#596B58] text-white" : "text-[#7A6E65] hover:text-[#3B302B]"
              }`}
              title="Poster Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md ${
                viewMode === "table" ? "bg-[#596B58] text-white" : "text-[#7A6E65] hover:text-[#3B302B]"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5DEC9] p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FFF8EC] text-[#596B58] flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#3B302B]">No Posters Found</h3>
          <p className="text-sm text-[#7A6E65] max-w-md mx-auto">
            Upload your first hero poster image to display on the storefront.
          </p>
          <Button onClick={handleOpenCreate} className="mx-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span>Upload Poster Image</span>
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* Poster Image Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBanners.map((banner, index) => (
            <div
              key={banner.id || index}
              className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                banner.isActive ? "border-[#E5DEC9]" : "border-amber-200 bg-amber-50/20 opacity-80"
              }`}
            >
              {/* Full Poster Image */}
              <div className="relative aspect-[21/9] w-full overflow-hidden bg-neutral-900 border-b border-[#E5DEC9]">
                <img
                  src={banner.desktopImage}
                  alt={banner.title}
                  className="w-full h-full object-cover transform hover:scale-[1.02] transition-transform duration-500"
                />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge variant={banner.isActive ? "success" : "warning"}>
                    {banner.isActive ? "Active (Live)" : "Draft (Hidden)"}
                  </Badge>
                  <span className="bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                    Slide #{banner.displayOrder ?? index + 1}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewBanner(banner)}
                  className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 backdrop-blur-xs transition-transform active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-[#596B58]" />
                  <span>Test Device Preview</span>
                </button>
              </div>

              {/* Card Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#3B302B]">{banner.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#7A6E65] mt-1.5 font-mono bg-[#FFF8EC] p-2 rounded-lg border border-[#E5DEC9]/60">
                    <ExternalLink className="w-3.5 h-3.5 text-[#596B58] shrink-0" />
                    <span className="truncate">Link: <strong className="text-[#3B302B] font-semibold">{banner.linkUrl || "/products"}</strong></span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between gap-2">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveOrder(index, "up")}
                      disabled={index === 0}
                      className="p-1.5 h-8 w-8"
                      title="Move Up in Carousel"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveOrder(index, "down")}
                      disabled={index === banners.length - 1}
                      className="p-1.5 h-8 w-8"
                      title="Move Down in Carousel"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Status Toggle & Edit/Delete */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(banner.id, banner.isActive)}
                      className={`text-xs flex items-center gap-1 ${
                        banner.isActive
                          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          : "border-amber-300 text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{banner.isActive ? "Pause" : "Activate"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(banner)}
                      className="p-1.5 h-8 w-8 text-[#3B302B]"
                      title="Edit Poster"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(banner.id, banner.title)}
                      className="p-1.5 h-8 w-8 text-rose-600 hover:bg-rose-50 border-rose-200"
                      title="Delete Poster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Data Table View */
        <AdminTable headers={["Order", "Poster Preview", "Target Link", "Status", "Actions"]}>
          {filteredBanners.map((b: BannerItem, idx: number) => (
            <tr key={b.id || idx} className="hover:bg-[#FFF8EC] transition-colors">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 font-bold text-xs text-[#3B302B]">
                  <span>#{b.displayOrder ?? idx + 1}</span>
                  <div className="flex flex-col ml-1">
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(idx, "up")}
                      disabled={idx === 0}
                      className="text-gray-400 hover:text-black disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(idx, "down")}
                      disabled={idx === banners.length - 1}
                      className="text-gray-400 hover:text-black disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-32 aspect-[21/9] rounded-lg overflow-hidden border border-[#E5DEC9] shrink-0 bg-neutral-900">
                    <img src={b.desktopImage} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#3B302B] line-clamp-1">{b.title}</h5>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-[#7A6E65]">
                {b.linkUrl || "/products"}
              </td>
              <td className="px-4 py-3.5">
                <Badge variant={b.isActive ? "success" : "warning"}>
                  {b.isActive ? "Active" : "Draft"}
                </Badge>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewBanner(b)}
                    className="p-1 h-7 w-7"
                    title="Live Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(b.id, b.isActive)}
                    className="p-1 h-7 w-7"
                    title={b.isActive ? "Pause" : "Activate"}
                  >
                    <Power className={`w-3.5 h-3.5 ${b.isActive ? "text-emerald-600" : "text-amber-600"}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(b)}
                    className="p-1 h-7 w-7 text-[#3B302B]"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(b.id, b.title)}
                    className="p-1 h-7 w-7 text-rose-600 hover:bg-rose-50 border-rose-200"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* CREATE / EDIT POSTER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? "Edit Hero Poster Image" : "Upload New Hero Poster Image"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {/* Quick Preset Posters */}
          {!editingBanner && (
            <div className="p-3 rounded-xl bg-[#FFF8EE] border border-[#E5DEC9] space-y-2">
              <span className="text-xs font-bold text-[#3B302B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#596B58]" />
                <span>Quick Preset Poster Samples (Click to auto-fill):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_POSTERS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[11px] font-semibold bg-white border border-[#E5DEC9] hover:border-[#596B58] hover:bg-[#FFF8EC] text-[#3B302B] px-2.5 py-1 rounded-md transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#3B302B] mb-1">
              Poster Name / Title (For identification) <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Belgian Truffle Weekend Offer Poster"
            />
          </div>

          {/* 1. UPLOAD SYSTEM: Main Desktop Poster Image */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#3B302B]">
              Poster Image File <span className="text-rose-500">*</span>
            </label>

            {desktopImage ? (
              <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden border border-[#E5DEC9] bg-neutral-900 group shadow-sm">
                <img src={desktopImage} alt="Poster Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => desktopFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white text-[#3B302B] text-xs font-bold shadow-md hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#596B58]" />
                    <span>Change Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesktopImage("")}
                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-md cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => desktopFileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E5DEC9] hover:border-[#596B58] rounded-2xl p-6 text-center space-y-2.5 bg-[#FFF8EC] cursor-pointer transition-colors"
              >
                {isUploadingDesktop ? (
                  <div className="space-y-2 py-3">
                    <Loader2 className="h-8 w-8 text-[#596B58] animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-[#7A6E65]">Uploading & Processing Poster File...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#FFF8EC] text-[#596B58] flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#3B302B]">
                        Click to Browse or Drag Poster Image file
                      </p>
                      <p className="text-[11px] text-[#7A6E65]">
                        Supports PNG, JPG, WEBP (Recommended: 1600 x 650 or 21:9 ratio)
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-lg bg-[#596B58] text-white text-xs font-bold shadow-xs">
                      Choose File from Computer / Device
                    </span>
                  </>
                )}
              </div>
            )}

            <input
              ref={desktopFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDesktopFileChange}
              className="hidden"
            />

            {desktopUploadError && (
              <p className="text-xs text-rose-600 font-semibold">{desktopUploadError}</p>
            )}

            {/* Direct URL input fallback */}
            <div className="pt-1">
              <input
                type="url"
                placeholder="Or paste image URL directly (https://...)"
                value={desktopImage}
                onChange={(e) => setDesktopImage(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-white"
              />
            </div>
          </div>

          {/* Optional Mobile Crop Poster Upload */}
          <div className="space-y-2 pt-1 border-t border-[#E5DEC9]/60">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#3B302B]">
                Mobile Specific Poster Image (Optional)
              </label>
              <span className="text-[10px] text-[#7A6E65]">If empty, desktop poster will auto-shrink</span>
            </div>

            {mobileImage ? (
              <div className="relative aspect-[16/9] w-48 rounded-xl overflow-hidden border border-[#E5DEC9] bg-neutral-900 group">
                <img src={mobileImage} alt="Mobile Poster" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setMobileImage("")}
                  className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => mobileFileInputRef.current?.click()}
                  className="text-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1 text-[#596B58]" />
                  <span>Upload Mobile Ratio Poster (16:9)</span>
                </Button>
                <input
                  ref={mobileFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMobileFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 2. LINK SYSTEM: Smart Destination Link Picker */}
          <div className="space-y-2 pt-2 border-t border-[#E5DEC9]">
            <label className="block text-xs font-bold text-[#3B302B] flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#596B58]" />
              <span>Poster Click Redirect Destination (Link System)</span>
            </label>

            {/* Quick Destination Dropdown */}
            <select
              value={selectedLinkType}
              onChange={(e) => setSelectedLinkType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold text-[#3B302B] outline-none focus:border-[#596B58] bg-white cursor-pointer"
            >
              <optgroup label="Popular Store Pages">
                {PRESET_LINK_OPTIONS.filter((o) => o.group === "Main Pages").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>

              <optgroup label="Store Categories">
                {categories.length > 0
                  ? categories.map((cat) => (
                      <option key={cat.slug || cat.id} value={`/categories/${cat.slug || cat.id}`}>
                        🍰 {cat.name} (/categories/{cat.slug || cat.id})
                      </option>
                    ))
                  : PRESET_LINK_OPTIONS.filter((o) => o.group === "Categories").map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
              </optgroup>

              <optgroup label="Occasions">
                {PRESET_LINK_OPTIONS.filter((o) => o.group === "Occasions").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>

              <optgroup label="Custom Link">
                <option value="CUSTOM">🔗 Custom URL / External Link...</option>
              </optgroup>
            </select>

            {/* Custom URL Input (if "CUSTOM" is selected) */}
            {selectedLinkType === "CUSTOM" && (
              <div className="pt-1">
                <Input
                  required
                  value={customLinkUrl}
                  onChange={(e) => setCustomLinkUrl(e.target.value)}
                  placeholder="Enter custom path or URL e.g. /products/special-cake or https://..."
                />
              </div>
            )}

            <p className="text-[11px] text-[#7A6E65]">
              Clicking anywhere on this poster will take the customer to:{" "}
              <strong className="text-[#3B302B]">
                {selectedLinkType === "CUSTOM" ? customLinkUrl || "(none)" : selectedLinkType}
              </strong>
            </p>
          </div>

          {/* Order & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5DEC9]">
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Carousel Slide Order (1 = first)
              </label>
              <Input
                type="number"
                min={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_active_toggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[#596B58] rounded border-[#E5DEC9]"
              />
              <label htmlFor="is_active_toggle" className="text-xs font-bold text-[#3B302B] cursor-pointer">
                Publish Active Immediately
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5DEC9]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || isUploadingDesktop}>
              {isSubmitting
                ? "Saving..."
                : isUploadingDesktop
                ? "Uploading Image..."
                : editingBanner
                ? "Update Poster"
                : "Save & Publish Poster"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* LIVE RESPONSIVE DEVICE PREVIEW MODAL */}
      {previewBanner && (
        <Modal
          isOpen={Boolean(previewBanner)}
          onClose={() => setPreviewBanner(null)}
          title="Live Responsive Device Preview"
        >
          <div className="space-y-4">
            {/* Device Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    previewDevice === "desktop"
                      ? "bg-[#3B302B] text-white shadow-xs"
                      : "bg-[#FFF8EC] text-[#7A6E65] border border-[#E5DEC9] hover:text-[#3B302B]"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop (Expand Mode)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    previewDevice === "mobile"
                      ? "bg-[#3B302B] text-white shadow-xs"
                      : "bg-[#FFF8EC] text-[#7A6E65] border border-[#E5DEC9] hover:text-[#3B302B]"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (Shrink Mode)</span>
                </button>
              </div>

              <span className="text-[11px] text-[#7A6E65] font-semibold hidden sm:inline">
                {previewDevice === "desktop" ? "Expanded Desktop View (1200px+)" : "Shrunk Mobile View (375px)"}
              </span>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="flex justify-center p-3 bg-[#FFF8EC] rounded-2xl border border-[#E5DEC9] overflow-hidden">
              {previewDevice === "desktop" ? (
                /* Desktop Expanded View */
                <div className="w-full rounded-2xl overflow-hidden border border-[#E5DEC9] shadow-md bg-neutral-900 aspect-[21/9]">
                  <img
                    src={previewBanner.desktopImage}
                    alt={previewBanner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                /* Mobile Shrunk View (Phone Frame Simulation) */
                <div className="w-[320px] max-w-full rounded-2xl border-4 border-[#3B302B] overflow-hidden shadow-xl bg-neutral-900 aspect-[16/9]">
                  <img
                    src={previewBanner.mobileImage || previewBanner.desktopImage}
                    alt={previewBanner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-[#7A6E65] font-mono">
                Click redirects to: <strong className="text-[#3B302B]">{previewBanner.linkUrl || "/products"}</strong>
              </span>
              <Button size="sm" variant="outline" onClick={() => setPreviewBanner(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
