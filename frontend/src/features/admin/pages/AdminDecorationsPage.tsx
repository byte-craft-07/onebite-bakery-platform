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
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { Modal, Badge } from "@/components/ui/DisplayComponents";
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
} from "@/services/decoration.service";
import { toast } from "@/contexts/toast.context";

const CATEGORY_OPTIONS = [
  "Candles & Toppers",
  "Party Balloons",
  "Cake Toppers",
  "Party Accessories",
  "Sparklers & Lights",
  "Birthday Sashes & Caps",
  "Festive Ribbons & Banners",
];

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

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Candles & Toppers");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState<number>(149);
  const [originalPrice, setOriginalPrice] = useState<number>(199);
  const [rating, setRating] = useState<number>(4.8);
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [inStock, setInStock] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);

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
    fetchDecorations();
  }, []);

  // Filtered List
  const filteredDecorations = useMemo(() => {
    return decorations.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" ||
        item.category.toLowerCase() === categoryFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && item.isActive) ||
        (statusFilter === "INACTIVE" && !item.isActive) ||
        (statusFilter === "IN_STOCK" && item.inStock) ||
        (statusFilter === "OUT_OF_STOCK" && !item.inStock);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [decorations, searchQuery, categoryFilter, statusFilter]);

  // Stats
  const totalCount = decorations.length;
  const activeCount = decorations.filter((d) => d.isActive).length;
  const inStockCount = decorations.filter((d) => d.inStock).length;
  const uniqueCategories = Array.from(new Set(decorations.map((d) => d.category))).length;

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName("");
    setCategory("Candles & Toppers");
    setCustomCategory("");
    setPrice(149);
    setOriginalPrice(199);
    setRating(4.9);
    setImage("https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80");
    setDescription("");
    setInStock(true);
    setIsActive(true);
    setDisplayOrder(decorations.length + 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Decoration) => {
    setEditingItem(item);
    setName(item.name || "");
    if (CATEGORY_OPTIONS.includes(item.category)) {
      setCategory(item.category);
      setCustomCategory("");
    } else {
      setCategory("CUSTOM");
      setCustomCategory(item.category);
    }
    setPrice(item.price || 0);
    setOriginalPrice(item.originalPrice || 0);
    setRating(item.rating || 4.8);
    setImage(item.image || "");
    setDescription(item.description || "");
    setInStock(item.inStock ?? true);
    setIsActive(item.isActive ?? true);
    setDisplayOrder(item.displayOrder || 0);
    setFormError(null);
    setIsModalOpen(true);
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
    if (!image.trim()) {
      setFormError("Please select or provide an image for the decoration.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    const payload: CreateDecorationPayload = {
      name: name.trim(),
      category: resolvedCategory,
      price: Number(price),
      originalPrice: Number(originalPrice),
      rating: Number(rating) || 4.8,
      image: image.trim(),
      description: description.trim(),
      inStock: Boolean(inStock),
      isActive: Boolean(isActive),
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
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save decoration item.";
      setFormError(msg);
      toast.error("Error Saving Item", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: Decoration) => {
    try {
      const updated = await decorationService.adminToggleStatus(item.id);
      setDecorations((prev) => prev.map((d) => (d.id === item.id ? updated : d)));
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
      toast.info(
        "Stock Updated",
        `"${item.name}" is now marked as ${updated.inStock ? "In Stock" : "Out of Stock"}.`
      );
    } catch (_err) {
      toast.error("Error", "Could not toggle stock status.");
    }
  };

  const handleDeletePermanent = async () => {
    if (!deleteConfirmItem) return;

    setIsDeleting(true);
    try {
      await decorationService.adminDeleteDecoration(deleteConfirmItem.id);
      // Immediately remove from state - permanently deleted from real MongoDB!
      setDecorations((prev) => prev.filter((d) => d.id !== deleteConfirmItem.id));
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
        description="Full CRUD management for celebration party candles, balloons, custom acrylic cake toppers, and poppers. Powered by real MongoDB."
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            placeholder="Search by name, category, or description..."
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
            {CATEGORY_OPTIONS.map((c) => (
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
                <AdminTableSkeleton columns={7} rows={5} />
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
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DEC9]">
                {filteredDecorations.map((item) => {
                  const discountPercent =
                    item.originalPrice > item.price
                      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#FFF8EC]/40 transition-colors">
                      {/* Item Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=150&q=75";
                            }}
                            className="h-12 w-12 rounded-xl object-cover border border-[#E5DEC9] shrink-0"
                          />
                          <div className="min-w-0 max-w-xs md:max-w-md">
                            <h4 className="font-bold text-[#3B302B] truncate">{item.name}</h4>
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
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-[#3B302B]">₹{item.price}</span>
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
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-bold text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{item.rating || 4.8}</span>
                        </div>
                      </td>

                      {/* Stock Toggle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            item.inStock
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                          title="Click to toggle stock status"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${item.inStock ? "bg-green-600" : "bg-red-600"}`} />
                          <span>{item.inStock ? "In Stock" : "Out of Stock"}</span>
                        </button>
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

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
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

      {/* Add / Edit Decoration Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title={editingItem ? "Edit Party Decoration" : "Add New Party Decoration"}
        >
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">Item Title *</label>
              <Input
                type="text"
                placeholder="e.g. Golden Metallic Happy Birthday Candle Set"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#596B58]"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
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

            {/* Price & Original Price */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Original Price (₹) *</label>
                <Input
                  type="number"
                  min={0}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Customer Rating (★)</label>
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

            {/* Image Uploader */}
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">Item Image *</label>
              <MediaUploader
                value={image}
                onChange={(url) => setImage(url)}
                entityType="PRODUCT"
                label="Decoration Item Photo"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">Description *</label>
              <textarea
                rows={3}
                placeholder="Brief description of the item, material, dimensions, or celebration use..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-[#E5DEC9] focus:outline-hidden focus:ring-2 focus:ring-[#596B58] bg-[#FFF8EC]/20"
                required
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E5DEC9]">
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

              <div>
                <label className="block text-[11px] font-bold text-[#7A6E65] mb-0.5">Display Order</label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                />
              </div>
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
                {isSubmitting ? "Saving to Database..." : editingItem ? "Update Decoration" : "Save Decoration"}
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
