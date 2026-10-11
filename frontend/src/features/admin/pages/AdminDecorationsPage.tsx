import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  Package,
  PartyPopper,
  Plus,
  Scale,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatCard,
  AdminTableSkeleton,
} from "../components/AdminComponents";
import { MediaUploader } from "../catalog/MediaUploader";
import {
  decorationService,
  type Decoration,
  type CreateDecorationPayload,
  type DecorationWeightOption,
} from "@/services/decoration.service";
import { adminCatalogService } from "../services/adminCatalog.service";
import { toast } from "@/contexts/toast.context";
import { clientCache } from "@/utils/clientCache";
import { getProductUnitLabel } from "@/utils/productGridUtils";

const DEFAULT_FALLBACK_CATEGORIES = [
  "Party Accessories",
  "Candles & Toppers",
  "Party Balloons",
  "Cake Toppers",
  "Sparklers & Lights",
  "Birthday Sashes & Caps",
  "Festive Ribbons & Banners",
];

const cleanSlug = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const AdminDecorationsPage: React.FC = () => {
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Decoration | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Decoration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields (matching Cake ProductFormModal features)
  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [slug, setSlug] = useState("");
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [unit, setUnit] = useState<string>("1 Pc");
  const [price, setPrice] = useState<number>(149);
  const [originalPrice, setOriginalPrice] = useState<number>(199);
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [rating, setRating] = useState<number>(4.8);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>("");
  const [weightRows, setWeightRows] = useState<DecorationWeightOption[]>([]);
  const [description, setDescription] = useState("");
  const [descriptionHi, setDescriptionHi] = useState("");
  const [inStock, setInStock] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isComingSoon, setIsComingSoon] = useState<boolean>(false);
  const [isInstantAvailable, setIsInstantAvailable] = useState<boolean>(true);
  const [isEggless, setIsEggless] = useState<boolean>(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const [catalogCats, decoCats] = await Promise.allSettled([
        adminCatalogService.getCategories(),
        decorationService.getDecorationCategories(),
      ]);

      const extractedNames: string[] = [];

      if (catalogCats.status === "fulfilled" && Array.isArray(catalogCats.value)) {
        catalogCats.value.forEach((c: any) => {
          const catName = typeof c === "string" ? c : c?.name || c?.title;
          if (catName && typeof catName === "string" && catName.trim()) {
            extractedNames.push(catName.trim());
          }
        });
      }

      if (decoCats.status === "fulfilled" && Array.isArray(decoCats.value)) {
        decoCats.value.forEach((catName) => {
          if (catName && typeof catName === "string" && catName.trim()) {
            extractedNames.push(catName.trim());
          }
        });
      }

      setDbCategories(extractedNames);
    } catch (_err) {
      // Keep existing categories if any
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchDecorations = async () => {
    setIsLoading(true);
    try {
      const items = await decorationService.adminGetDecorations();
      setDecorations(items);
    } catch (_err) {
      toast.error("Error", "Failed to load decorations from database.");
      setDecorations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDecorations();
    void fetchCategories();
  }, []);

  // Dynamic Category Options combined from real MongoDB database categories + items
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();

    dbCategories.forEach((cat) => {
      if (cat && cat.trim()) set.add(cat.trim());
    });

    decorations.forEach((d) => {
      if (d.category && d.category.trim()) set.add(d.category.trim());
    });

    if (set.size === 0) {
      DEFAULT_FALLBACK_CATEGORIES.forEach((c) => set.add(c));
    }

    return Array.from(set);
  }, [dbCategories, decorations]);

  useEffect(() => {
    if (!category && categoryOptions.length > 0) {
      const preferred =
        categoryOptions.find((c) => /decor/i.test(c)) ||
        categoryOptions[0];
      setCategory(preferred);
    }
  }, [category, categoryOptions]);

  // Filtered List
  const filteredDecorations = useMemo(() => {
    return decorations.filter((item) => {
      if (!item) return false;
      const q = (searchQuery || "").trim().toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const matchesSearch =
        q === "" ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.nameHi || "").toLowerCase().includes(q) ||
        (item.sku || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        cat.includes(q);

      const matchesCategory =
        categoryFilter === "ALL" ||
        cat === (categoryFilter || "").toLowerCase();

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && item.isActive) ||
        (statusFilter === "INACTIVE" && !item.isActive) ||
        (statusFilter === "IN_STOCK" && item.inStock) ||
        (statusFilter === "OUT_OF_STOCK" && !item.inStock) ||
        (statusFilter === "COMING_SOON" && Boolean(item.isComingSoon));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [decorations, searchQuery, categoryFilter, statusFilter]);

  // Stats
  const totalCount = decorations.length;
  const activeCount = decorations.filter((d) => d.isActive).length;
  const inStockCount = decorations.filter((d) => d.inStock).length;
  const comingSoonCount = decorations.filter((d) => d.isComingSoon).length;
  const uniqueCategories = Array.from(new Set(decorations.map((d) => d.category))).length;

  const invalidateAllCaches = () => {
    clientCache.invalidate("decorations");
    clientCache.invalidate("decorations_list");
    clientCache.invalidate("catalog_categories");
    clientCache.clear();
    window.dispatchEvent(new Event("onebitebakery_catalog_updated"));
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName("");
    setNameHi("");
    setSlug("");
    setIsManualSlug(false);
    setSku(`DEC-${Date.now()}`);
    const defaultCat =
      categoryOptions.find((c) => /decor/i.test(c)) ||
      categoryOptions[0] ||
      "Party Accessories";
    setCategory(defaultCat);
    setCustomCategory("");
    setUnit("1 Pack");
    setPrice(149);
    setOriginalPrice(199);
    setStockQuantity(50);
    setRating(4.9);
    setImageUrls([]);
    setNewImageUrl("");
    setWeightRows([
      { weight: "1 Pack", serves: "Standard Pack", price: 149, compareAtPrice: 199 },
    ]);
    setDescription("");
    setDescriptionHi("");
    setInStock(true);
    setIsActive(true);
    setIsComingSoon(false);
    setIsInstantAvailable(true);
    setIsEggless(true);
    setDisplayOrder(decorations.length + 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Decoration) => {
    setEditingItem(item);
    setName(item.name || "");
    setNameHi(item.nameHi || "");
    setSlug(item.slug || cleanSlug(item.name || ""));
    setIsManualSlug(Boolean(item.slug));
    setSku(item.sku || `DEC-${item.slug || item.id}`);
    const itemCat = (item.category || "").trim();
    if (categoryOptions.includes(itemCat) || itemCat) {
      setCategory(itemCat);
      setCustomCategory("");
    } else {
      setCategory("CUSTOM");
      setCustomCategory(item.category || "");
    }
    const resolvedUnit = item.unit || getProductUnitLabel(item);
    setUnit(resolvedUnit);
    setPrice(item.price || 0);
    setOriginalPrice(item.originalPrice || 0);
    setStockQuantity(
      typeof item.stockQuantity === "number"
        ? item.stockQuantity
        : item.inStock !== false
        ? 50
        : 0
    );
    setRating(item.rating || 4.8);

    const imgs: string[] = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
      imgs.push(...item.images.filter(Boolean));
    }
    if (item.image && !imgs.includes(item.image)) {
      imgs.unshift(item.image);
    }
    setImageUrls(imgs);
    setNewImageUrl("");

    if (Array.isArray(item.weightOptions) && item.weightOptions.length > 0) {
      setWeightRows(
        item.weightOptions.map((w) => ({
          weight: w.weight || resolvedUnit,
          serves: w.serves || "",
          price: Number(w.price) || item.price || 0,
          compareAtPrice: w.compareAtPrice ? Number(w.compareAtPrice) : item.originalPrice,
        }))
      );
    } else {
      setWeightRows([
        {
          weight: resolvedUnit,
          serves: item.category || "Party Accessory",
          price: item.price || 0,
          compareAtPrice: item.originalPrice || undefined,
        },
      ]);
    }

    setDescription(item.description || "");
    setDescriptionHi(item.descriptionHi || "");
    setInStock(item.inStock ?? true);
    setIsActive(item.isActive ?? true);
    setIsComingSoon(Boolean(item.isComingSoon));
    setIsInstantAvailable(item.isInstantAvailable !== false);
    setIsEggless(item.isEggless !== false);
    setDisplayOrder(item.displayOrder || 0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isManualSlug) {
      setSlug(cleanSlug(val));
    }
  };

  const handleAddImage = (url: string) => {
    if (!url || !url.trim()) return;
    const clean = url.trim();
    setImageUrls((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetMainImage = (index: number) => {
    setImageUrls((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
  };

  const handleAddWeightRow = () => {
    setWeightRows((prev) => [
      ...prev,
      {
        weight: "Pack of 2",
        serves: "Value Pack",
        price: Math.round((Number(price) || 149) * 1.8),
        compareAtPrice: Math.round((Number(originalPrice) || 199) * 1.8),
      },
    ]);
  };

  const handleRemoveWeightRow = (idx: number) => {
    setWeightRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateWeightRow = (
    idx: number,
    field: keyof DecorationWeightOption,
    value: any
  ) => {
    setWeightRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const resolvedCategory = category === "CUSTOM" ? customCategory.trim() : category.trim();

    if (!name.trim()) {
      setFormError("Decoration item name is required.");
      return;
    }
    if (!resolvedCategory) {
      setFormError("Category is required.");
      return;
    }
    if (price < 0 || originalPrice < 0) {
      setFormError("Price and original price must be positive numbers.");
      return;
    }
    if (imageUrls.length === 0 && !newImageUrl.trim()) {
      setFormError("Please upload or add at least one product photo.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    const finalImages =
      imageUrls.length > 0
        ? imageUrls
        : [newImageUrl.trim()];

    const finalWeightOptions = weightRows
      .filter((w) => w.weight && w.weight.trim().length > 0 && Number(w.price) >= 0)
      .map((w) => ({
        weight: w.weight.trim(),
        serves: w.serves?.trim() || undefined,
        price: Number(w.price),
        compareAtPrice:
          w.compareAtPrice && Number(w.compareAtPrice) > 0
            ? Number(w.compareAtPrice)
            : undefined,
      }));

    const resolvedUnit =
      unit.trim() ||
      (finalWeightOptions.length > 0 ? finalWeightOptions[0].weight : "1 Pc");

    const payload: CreateDecorationPayload = {
      name: name.trim(),
      nameHi: nameHi.trim() || undefined,
      slug: cleanSlug(slug || name),
      sku: sku.trim() || `DEC-${Date.now()}`,
      category: resolvedCategory,
      unit: resolvedUnit,
      price: Number(price),
      originalPrice: Number(originalPrice),
      stockQuantity: Number(stockQuantity),
      rating: Number(rating) || 4.8,
      image: finalImages[0],
      images: finalImages,
      weightOptions: finalWeightOptions,
      description: description.trim(),
      descriptionHi: descriptionHi.trim() || undefined,
      inStock: Boolean(inStock) && Number(stockQuantity) > 0,
      isActive: Boolean(isActive),
      isComingSoon: Boolean(isComingSoon),
      isInstantAvailable: Boolean(isInstantAvailable),
      isEggless: Boolean(isEggless),
      displayOrder: Number(displayOrder) || 0,
    };

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const updated = await decorationService.adminUpdateDecoration(editingItem.id, payload);
        setDecorations((prev) => prev.map((item) => (item.id === editingItem.id ? updated : item)));
        toast.success("Updated Successfully! 🎉", `"${updated.name}" updated in database.`);
      } else {
        const created = await decorationService.adminCreateDecoration(payload);
        setDecorations((prev) => [created, ...prev]);
        toast.success("Created Successfully! 🎈", `"${created.name}" saved to database.`);
      }
      if (resolvedCategory) {
        setDbCategories((prev) => Array.from(new Set([...prev, resolvedCategory])));
      }
      invalidateAllCaches();
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save decoration item.";
      setFormError(msg);
      toast.error("Error Saving Item", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockStepper = async (item: Decoration, delta: number) => {
    const currentQty =
      typeof item.stockQuantity === "number"
        ? item.stockQuantity
        : item.inStock
        ? 50
        : 0;
    const nextQty = Math.max(0, currentQty + delta);
    try {
      const updated = await decorationService.adminUpdateInventory(item.id, nextQty);
      setDecorations((prev) => prev.map((d) => (d.id === item.id ? updated : d)));
      invalidateAllCaches();
    } catch (_err) {
      toast.error("Error", "Could not update stock quantity.");
    }
  };

  const handleToggleActive = async (item: Decoration) => {
    try {
      const updated = await decorationService.adminToggleStatus(item.id);
      setDecorations((prev) => prev.map((d) => (d.id === item.id ? updated : d)));
      invalidateAllCaches();
      toast.info(
        "Status Changed",
        `"${item.name}" is now ${updated.isActive ? "Active (Visible)" : "Inactive (Hidden)"}.`
      );
    } catch (_err) {
      toast.error("Error", "Could not toggle status.");
    }
  };

  const handleToggleStock = async (item: Decoration) => {
    try {
      const updated = await decorationService.adminToggleStock(item.id);
      setDecorations((prev) => prev.map((d) => (d.id === item.id ? updated : d)));
      invalidateAllCaches();
      toast.info(
        "Stock Updated",
        `"${item.name}" is now marked as ${updated.inStock ? "In Stock" : "Out of Stock"}.`
      );
    } catch (_err) {
      toast.error("Error", "Could not toggle stock status.");
    }
  };

  const handleToggleComingSoon = async (item: Decoration) => {
    try {
      const updated = await decorationService.adminToggleComingSoon(item.id);
      setDecorations((prev) => prev.map((d) => (d.id === item.id ? updated : d)));
      invalidateAllCaches();
      toast.info(
        "Coming Soon Updated",
        `"${item.name}" is now marked as ${updated.isComingSoon ? "Coming Soon (जल्द आ रहा है)" : "Live (Available)"}.`
      );
    } catch (_err) {
      toast.error("Error", "Could not toggle Coming Soon status.");
    }
  };

  const handleDeletePermanent = async () => {
    if (!deleteConfirmItem) return;

    setIsDeleting(true);
    try {
      await decorationService.adminDeleteDecoration(deleteConfirmItem.id);
      setDecorations((prev) => prev.filter((d) => d.id !== deleteConfirmItem.id));
      invalidateAllCaches();
      toast.success("Deleted Permanently", `"${deleteConfirmItem.name}" was deleted from database.`);
      setDeleteConfirmItem(null);
    } catch (_err) {
      toast.error("Delete Failed", "Failed to delete decoration item from database.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Party Decorations & Accessories"
        description="Full CRUD management with Multi-Image Gallery, Multi-Tier Pack/Pcs Pricing, Inventory Stepper, and Instant Delivery controls."
        actions={
          <div className="flex items-center gap-3">
            <Link
              to="/decorations"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#596B58] bg-[#596B58]/10 hover:bg-[#596B58]/20 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Preview Live Shop</span>
            </Link>
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-[#596B58] hover:bg-[#495948] text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Decoration</span>
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <AdminStatCard
          title="Total Decorations"
          value={totalCount}
          icon={<PartyPopper className="h-5 w-5" />}
        />
        <AdminStatCard
          title="Active Storefront Items"
          value={activeCount}
          icon={<Eye className="h-5 w-5" />}
        />
        <AdminStatCard
          title="In Stock Ready"
          value={inStockCount}
          icon={<Package className="h-5 w-5" />}
        />
        <AdminStatCard
          title="Coming Soon Items"
          value={comingSoonCount}
          icon={<span className="text-base">🚀</span>}
        />
        <AdminStatCard
          title="Categories"
          value={uniqueCategories}
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5DEC9] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, Hindi name, SKU, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-[#E5DEC9] focus:outline-hidden focus:ring-2 focus:ring-[#596B58] bg-[#FFF8EC]/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#596B58]"
          >
            <option value="ALL">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#596B58]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active (Live)</option>
            <option value="INACTIVE">Inactive (Hidden)</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="COMING_SOON">🚀 Coming Soon</option>
          </select>

          {(searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="p-2 text-xs text-gray-500 hover:text-red-600 rounded-xl hover:bg-gray-100 transition-colors"
              title="Clear Filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="bg-white rounded-2xl border border-[#E5DEC9] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs md:text-sm">
              <tbody>
                <AdminTableSkeleton columns={8} rows={5} />
              </tbody>
            </table>
          </div>
        ) : filteredDecorations.length === 0 ? (
          <div className="p-6">
            <AdminEmptyState
              title="No party decoration items found"
              description={
                searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL"
                  ? "Try clearing filters to see all decorations."
                  : "Start by adding your first party decoration item to the database."
              }
              action={
                <Button variant="primary" onClick={handleOpenCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Decoration
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#FFF8EC] border-b border-[#E5DEC9] text-[#7A6E65] font-bold uppercase tracking-wider text-[10px] md:text-xs">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price & Tiers</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Stock & Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Coming Soon</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DEC9]">
                {filteredDecorations.map((item) => {
                  const discountPercent =
                    item.originalPrice > item.price
                      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                      : 0;
                  const photoCount = Array.isArray(item.images) ? item.images.length : 1;
                  const tierCount = Array.isArray(item.weightOptions) ? item.weightOptions.length : 1;
                  const stockQty =
                    typeof item.stockQuantity === "number"
                      ? item.stockQuantity
                      : item.inStock
                      ? 50
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#FFF8EC]/40 transition-colors">
                      {/* Item Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-[#E5DEC9] shrink-0 bg-[#FFF8EC]">
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=150&q=75";
                              }}
                              className="h-full w-full object-cover"
                            />
                            {photoCount > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-white text-[8px] font-extrabold px-1 py-0.2 rounded">
                                {photoCount} pics
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs md:max-w-md">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                to={`/products/${item.slug || item.id}`}
                                target="_blank"
                                className="font-bold text-[#3B302B] hover:text-[#596B58] hover:underline truncate"
                                title="Click to open Product Details Page"
                              >
                                {item.name}
                              </Link>
                              {item.isInstantAvailable !== false && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  <Zap className="h-2.5 w-2.5 fill-current" /> Instant
                                </span>
                              )}
                              {item.isComingSoon && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                  🚀 Coming Soon
                                </span>
                              )}
                            </div>
                            {item.nameHi && (
                              <p className="text-[10px] font-semibold text-[#596B58] truncate">
                                {item.nameHi}
                              </p>
                            )}
                            <p className="text-[11px] text-[#7A6E65] line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#596B58]/10 text-[#596B58]">
                          {item.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#3B302B]">₹{item.price}</span>
                            <span className="text-[10px] font-bold text-[#596B58] bg-[#596B58]/10 border border-[#596B58]/25 px-1.5 py-0.5 rounded leading-none">
                              {getProductUnitLabel(item)}
                            </span>
                            {item.originalPrice > item.price && (
                              <>
                                <span className="text-[10px] text-gray-400 line-through">
                                  ₹{item.originalPrice}
                                </span>
                                <span className="text-[10px] text-green-600 font-bold">
                                  {discountPercent}% off
                                </span>
                              </>
                            )}
                          </div>
                          {tierCount > 1 && (
                            <span className="inline-block text-[10px] text-gray-500 font-semibold">
                              +{tierCount - 1} more pack/size options
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-bold text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{item.rating || 4.8}</span>
                        </div>
                      </td>

                      {/* Stock & Stepper */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center border border-[#E5DEC9] rounded-lg bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleStockStepper(item, -1)}
                              className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                              title="Decrease stock"
                            >
                              -
                            </button>
                            <span className="px-2 py-0.5 text-xs font-extrabold text-[#3B302B]">
                              {stockQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStockStepper(item, 1)}
                              className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                              title="Increase stock"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleStock(item)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              item.inStock
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                            title="Click to toggle stock status"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${item.inStock ? "bg-green-600" : "bg-red-600"}`} />
                            <span>{item.inStock ? "In Stock" : "Out"}</span>
                          </button>
                        </div>
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            item.isActive
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title="Click to toggle public visibility"
                        >
                          {item.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          <span>{item.isActive ? "Active" : "Hidden"}</span>
                        </button>
                      </td>

                      {/* Coming Soon Toggle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleComingSoon(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            item.isComingSoon
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent"
                          }`}
                          title="Click to toggle Coming Soon status"
                        >
                          <span>{item.isComingSoon ? "🚀 Coming Soon" : "Available"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/products/${item.slug || item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-gray-600 hover:text-[#596B58] hover:bg-[#596B58]/10 transition-colors"
                            title="View Product Details Page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-[#596B58] hover:bg-[#596B58]/10 transition-colors cursor-pointer"
                            title="Edit Decoration"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Decoration Modal (Full Cake Product Feature Parity) */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title={editingItem ? "Edit Party Decoration & Photos" : "Create New Party Decoration"}
        >
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[82vh] overflow-y-auto pr-1">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Name & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  Decoration Name (English) *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Golden Metallic Happy Birthday Candle Set"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  Slug (URL Friendly) *
                </label>
                <Input
                  type="text"
                  placeholder="golden-metallic-happy-birthday-candle-set"
                  value={slug}
                  onChange={(e) => {
                    setIsManualSlug(true);
                    setSlug(cleanSlug(e.target.value));
                  }}
                  required
                />
              </div>
            </div>

            {/* Hindi Name & SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  Decoration Name (Hindi / हिंदी) (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="उदा. गोल्डन मेटैलिक हैप्पी बर्थडे कैंडल सेट"
                  value={nameHi}
                  onChange={(e) => setNameHi(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  SKU Code
                </label>
                <Input
                  type="text"
                  placeholder="DEC-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#3B302B]">
                    Category *
                  </label>
                  {isLoadingCategories && (
                    <span className="text-[10px] text-gray-400 animate-pulse">Loading DB categories...</span>
                  )}
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== "CUSTOM") {
                      setCustomCategory("");
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#596B58]"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Custom Category</option>
                </select>
              </div>

              {category === "CUSTOM" && (
                <div>
                  <label className="block text-xs font-bold text-[#3B302B] mb-1">Custom Category Name *</label>
                  <Input
                    type="text"
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* Price, Original Price, Unit, Stock & Rating */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Selling Price (₹) *</label>
                <Input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">MRP / Compare (₹) *</label>
                <Input
                  type="number"
                  min={0}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Base Unit / Pack *</label>
                <Input
                  type="text"
                  placeholder="1 Pc, 1 Pack, 50 Pcs"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Stock Qty *</label>
                <Input
                  type="number"
                  min={0}
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Rating (★)</label>
                <Input
                  type="number"
                  step="0.1"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Multi-Image Gallery Manager (Cloned from Cake ProductFormModal) */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-[#3B302B]">
                    Product Photos Gallery ({imageUrls.length} images) *
                  </label>
                  <p className="text-[11px] text-[#7A6E65]">
                    Upload multiple photos for the storefront image slider, dots & product details gallery
                  </p>
                </div>
                {imageUrls.length > 0 && (
                  <span className="text-[10px] font-extrabold bg-[#E53935] text-white px-2 py-0.5 rounded-full">
                    {imageUrls.length} Added
                  </span>
                )}
              </div>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden border border-[#E5DEC9] group bg-white shadow-2xs"
                    >
                      <img
                        src={url}
                        alt={`Decoration photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 flex items-center gap-1">
                        <span className="bg-black/65 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          {idx === 0 ? "Main" : `#${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(idx)}
                            className="bg-[#596B58] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Make this the Main Photo"
                          >
                            Set Main
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 cursor-pointer shadow-xs"
                        title="Remove Photo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <MediaUploader
                value={newImageUrl}
                onChange={(url) => {
                  if (url) handleAddImage(url);
                }}
                entityType="PRODUCT"
                multiple={true}
                label="Add Decoration Photo(s) (Multiple Supported)"
              />
            </div>

            {/* Multi-Tier Weight / Pack / Pcs Options & Pricing (Cloned from Cake ProductFormModal) */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#596B58]" />
                  <div>
                    <label className="block text-xs font-bold text-[#3B302B]">
                      Pack / Pcs / Weight Options & Pricing (पैक / पीस व कीमत विकल्प)
                    </label>
                    <p className="text-[11px] text-[#7A6E65]">
                      Add multiple pack or piece count tiers (e.g. 1 Pack, Pack of 2, 50 Pcs, 100 Pcs) for Product Details selection.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWeightRow}
                  className="text-xs h-7 gap-1 border-[#596B58] text-[#596B58]"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Option</span>
                </Button>
              </div>

              {weightRows.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-[#7A6E65] uppercase px-1">
                    <div className="col-span-3">Pack / Pcs / Size</div>
                    <div className="col-span-3">Details / Info</div>
                    <div className="col-span-3">Price (₹ कीमत)</div>
                    <div className="col-span-2">MRP (₹)</div>
                    <div className="col-span-1 text-center">Del</div>
                  </div>

                  {weightRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-[#E5DEC9]"
                    >
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={row.weight}
                          placeholder="e.g. 1 Pack, 50 Pcs"
                          onChange={(e) => handleUpdateWeightRow(idx, "weight", e.target.value)}
                          className="w-full p-1.5 text-xs rounded border border-[#E5DEC9] font-bold text-[#3B302B] outline-none focus:border-[#596B58]"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={row.serves || ""}
                          placeholder="e.g. Party Pack"
                          onChange={(e) => handleUpdateWeightRow(idx, "serves", e.target.value)}
                          className="w-full p-1.5 text-xs rounded border border-[#E5DEC9] text-[#7A6E65] outline-none focus:border-[#596B58]"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={row.price}
                          min={0}
                          placeholder="₹ Price"
                          onChange={(e) => handleUpdateWeightRow(idx, "price", Number(e.target.value))}
                          className="w-full p-1.5 text-xs rounded border border-[#E5DEC9] font-bold text-[#596B58] outline-none focus:border-[#596B58]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={row.compareAtPrice ?? ""}
                          min={0}
                          placeholder="MRP"
                          onChange={(e) =>
                            handleUpdateWeightRow(
                              idx,
                              "compareAtPrice",
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          className="w-full p-1.5 text-xs rounded border border-[#E5DEC9] text-gray-400 outline-none focus:border-[#596B58]"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveWeightRow(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                          title="Remove Option"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic p-2 bg-white rounded-lg border border-dashed border-gray-300 text-center">
                  No custom pack tiers added. Base Selling Price & Unit will be used.
                </p>
              )}
            </div>

            {/* Descriptions (English & Hindi) */}
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Description (English) *
              </label>
              <textarea
                rows={3}
                placeholder="Brief description of the item, material, dimensions, or celebration use..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-[#E5DEC9] focus:outline-hidden focus:ring-2 focus:ring-[#596B58] bg-[#FFF8EC]/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Description (Hindi / हिंदी) (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="पार्टी डेकोरेशन आइटम का विवरण हिंदी में..."
                value={descriptionHi}
                onChange={(e) => setDescriptionHi(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-[#E5DEC9] focus:outline-hidden focus:ring-2 focus:ring-[#596B58] bg-[#FFF8EC]/20"
              />
            </div>

            {/* Toggles & Instant Delivery */}
            <div className="space-y-3 pt-2 border-t border-[#E5DEC9]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#3B302B]">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="rounded text-[#596B58] focus:ring-[#596B58] h-4 w-4"
                  />
                  <span>In Stock Ready</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#3B302B]">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#596B58] focus:ring-[#596B58] h-4 w-4"
                  />
                  <span>Active on Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#3B302B]">
                  <input
                    type="checkbox"
                    checked={isComingSoon}
                    onChange={(e) => setIsComingSoon(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span>🚀 Coming Soon</span>
                </label>

                <div>
                  <label className="block text-[11px] font-bold text-[#7A6E65] mb-0.5">Display Order</label>
                  <Input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs font-medium cursor-pointer p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 hover:bg-amber-100/70 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={isInstantAvailable}
                  onChange={(e) => setIsInstantAvailable(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-400 text-[#596B58] focus:ring-[#596B58] cursor-pointer"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-xs text-[#3B302B] flex items-center gap-1.5">
                    ⚡ Ready to Deliver (Instant)
                  </span>
                  <span className="text-[11px] text-gray-600 font-normal">
                    Keep checked for in-stock party accessories ready for fast 30-45m delivery.
                  </span>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#E5DEC9] flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="bg-[#596B58] hover:bg-[#495948] text-white text-xs font-bold"
              >
                {isSubmitting ? "Saving to Database..." : editingItem ? "Update Decoration & Photos" : "Save Decoration & Photos"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <Modal
          isOpen={Boolean(deleteConfirmItem)}
          onClose={() => !isDeleting && setDeleteConfirmItem(null)}
          title="Delete Decoration Permanently"
        >
          <div className="space-y-4">
            <p className="text-xs md:text-sm text-[#7A6E65]">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#3B302B]">"{deleteConfirmItem.name}"</strong> from MongoDB?
            </p>
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              ⚠️ This will remove the item permanently from the database. It will disappear from the storefront and will not re-appear.
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DEC9]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeletePermanent}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                {isDeleting ? "Deleting from Database..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
