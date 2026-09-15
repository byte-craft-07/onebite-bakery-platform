import React, { useEffect, useState } from "react";
import {
  Check,
  Edit2,
  Gift,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  AdminTableSkeleton,
  AdminToolbar,
} from "../components/AdminComponents";
import { MediaUploader } from "../catalog/MediaUploader";
import { comboService, type Combo, type CreateComboPayload } from "@/services/combo.service";

export const AdminCombosPage: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(999);
  const [originalPrice, setOriginalPrice] = useState<number>(1299);
  const [image, setImage] = useState("");
  const [badge, setBadge] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [items, setItems] = useState<string[]>([]);
  const [newItemInput, setNewItemInput] = useState("");

  const fetchCombos = async () => {
    setIsLoading(true);
    try {
      const list = await comboService.adminGetCombos();
      setCombos(list);
    } catch (_err) {
      setCombos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const handleOpenCreate = () => {
    setEditingCombo(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setPrice(999);
    setOriginalPrice(1299);
    setImage("https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80");
    setBadge("Popular Value");
    setIsActive(true);
    setItems(["1kg Belgian Chocolate Cake", "12 Assorted Macarons", "2 Party Poppers"]);
    setNewItemInput("");
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (combo: Combo) => {
    setEditingCombo(combo);
    setTitle(combo.title || "");
    setSlug(combo.slug || "");
    setDescription(combo.description || "");
    setPrice(combo.price || 0);
    setOriginalPrice(combo.originalPrice || 0);
    setImage(combo.image || "");
    setBadge(combo.badge || "");
    setIsActive(combo.isActive);
    setItems(Array.isArray(combo.items) ? [...combo.items] : []);
    setNewItemInput("");
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newItemInput.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
      setNewItemInput("");
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItems(items.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a combo title.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Please add at least one item to the hamper.");
      return;
    }
    if (!price || price <= 0) {
      setErrorMessage("Please specify a valid price.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CreateComboPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      items,
      price: Number(price),
      originalPrice: Number(originalPrice) || Number(price),
      image: image.trim(),
      badge: badge.trim() || undefined,
      isActive,
    };

    try {
      if (editingCombo) {
        await comboService.updateCombo(editingCombo.id, payload);
        setSuccessMessage(`Combo "${payload.title}" updated successfully!`);
      } else {
        await comboService.createCombo(payload);
        setSuccessMessage(`Combo "${payload.title}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchCombos();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to save combo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (combo: Combo) => {
    try {
      const updated = await comboService.toggleComboStatus(combo.id);
      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, isActive: updated.isActive } : c))
      );
      setSuccessMessage(`Combo "${combo.title}" is now ${updated.isActive ? "Active" : "Inactive"}.`);
    } catch (_err) {
      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, isActive: !c.isActive } : c))
      );
    }
  };

  const handleDelete = async (combo: Combo) => {
    if (!window.confirm(`Are you sure you want to delete celebration combo "${combo.title}"?`)) {
      return;
    }
    try {
      await comboService.deleteCombo(combo.id);
      setCombos((prev) => prev.filter((c) => c.id !== combo.id));
      setSuccessMessage(`Combo "${combo.title}" deleted successfully.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete combo.");
    }
  };

  // Filtered list
  const filteredCombos = combos.filter((combo) => {
    const matchesSearch =
      combo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (combo.items && combo.items.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;
    if (statusFilter === "ACTIVE") return combo.isActive;
    if (statusFilter === "INACTIVE") return !combo.isActive;
    return true;
  });

  const totalCount = combos.length;
  const activeCount = combos.filter((c) => c.isActive).length;
  const avgPrice =
    totalCount > 0
      ? Math.round(combos.reduce((sum, c) => sum + (c.price || 0), 0) / totalCount)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <AdminPageHeader
        title="Celebration Combos Management"
        description="Create, curate, edit and manage party hampers, celebration combos, pricing and included items."
        actions={
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create New Combo</span>
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Hampers"
          value={totalCount}
          icon={<Gift className="h-5 w-5" />}
          change="100%"
          isPositive={true}
        />
        <AdminStatCard
          title="Active Storefront Combos"
          value={activeCount}
          icon={<Sparkles className="h-5 w-5" />}
        />
        <AdminStatCard
          title="Average Combo Price"
          value={`₹${avgPrice}`}
          icon={<Tag className="h-5 w-5" />}
        />
        <AdminStatCard
          title="Inactive / Draft"
          value={totalCount - activeCount}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 p-4 text-xs font-semibold text-green-800 animate-in fade-in">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800 animate-in fade-in">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <AdminToolbar
        searchPlaceholder="Search combo title, included items..."
        onSearchChange={(val) => setSearchQuery(val)}
        filterOptions={[
          { label: "All Combos", value: "ALL" },
          { label: "Active Only", value: "ACTIVE" },
          { label: "Inactive Only", value: "INACTIVE" },
        ]}
        onFilterChange={(val) => setStatusFilter(val)}
      />

      {/* Table Content */}
      <AdminTable headers={["Image", "Combo Details", "Items Included", "Pricing", "Status", "Actions"]}>
        {isLoading ? (
          <AdminTableSkeleton columns={6} rows={4} />
        ) : filteredCombos.length === 0 ? (
          <tr>
            <td colSpan={6} className="p-4">
              <AdminEmptyState
                title="No celebration combos found"
                description="Create a new celebration hamper bundle to display it in the combos catalog."
                action={
                  <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-1" />
                    <span>Create Combo</span>
                  </Button>
                }
              />
            </td>
          </tr>
        ) : (
          filteredCombos.map((combo: Combo) => {
            const discountPct =
              combo.originalPrice && combo.originalPrice > combo.price
                ? Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)
                : 0;

            return (
              <tr key={combo.id} className="hover:bg-[#FFF8EC]/60 transition-colors">
                {/* Image */}
                <td className="px-4 py-4">
                  <div className="h-14 w-20 rounded-xl overflow-hidden bg-gray-100 border border-[#E5DEC9] shrink-0">
                    <img
                      src={combo.image}
                      alt={combo.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </td>

                {/* Details */}
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#3B302B] text-sm">{combo.title}</span>
                      {combo.badge && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFF8EC] text-[#596B58] border border-[#596B58]/30">
                          {combo.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7A6E65] line-clamp-1 max-w-xs">
                      {combo.description || "No description provided."}
                    </p>
                    <p className="text-[11px] font-mono text-gray-400">/combos/{combo.slug}</p>
                  </div>
                </td>

                {/* Items */}
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {combo.items && combo.items.length > 0 ? (
                      combo.items.map((it: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] bg-[#FFF8EC] text-[#3B302B] px-2 py-0.5 rounded-md border border-[#E5DEC9]"
                        >
                          <Check className="h-3 w-3 text-green-600 shrink-0" />
                          <span className="truncate max-w-[120px]">{it}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No items listed</span>
                    )}
                  </div>
                </td>

                {/* Pricing */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-[#3B302B]">₹{combo.price}</span>
                      {combo.originalPrice && combo.originalPrice > combo.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{combo.originalPrice}
                        </span>
                      )}
                    </div>
                    {discountPct > 0 && (
                      <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>
                </td>

                {/* Status Toggle */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(combo)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                      combo.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title="Click to toggle status"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        combo.isActive ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span>{combo.isActive ? "Active" : "Inactive"}</span>
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(combo)}
                      className="p-2 h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Edit Combo"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(combo)}
                      className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete Combo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </AdminTable>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCombo ? "Edit Celebration Combo" : "Create New Celebration Combo"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Combo Title */}
          <div>
            <label className="block text-xs font-bold text-[#3B302B] mb-1">
              Combo Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Birthday Party Celebration Combo"
              required
            />
          </div>

          {/* Slug & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Custom Slug (Optional)
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. birthday-party-combo"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Badge / Tag (Optional)
              </label>
              <Input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Bestseller, Mega Saver, Chef Choice"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="1199"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Original MRP Price (₹)
              </label>
              <Input
                type="number"
                min="1"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                placeholder="1499"
              />
            </div>
          </div>

          {/* Image Upload / URL */}
          <div className="space-y-1">
            <MediaUploader
              value={image}
              onChange={(url) => setImage(url)}
              label="Hamper Main Image (Upload from Device or URL) *"
              entityType="PRODUCT"
            />
          </div>

          {/* Dynamic Items Builder */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-[#3B302B]">
              Items Included in Hamper <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={newItemInput}
                onChange={(e) => setNewItemInput(e.target.value)}
                placeholder="e.g. 1kg Belgian Truffle Cake"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => handleAddItem()} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                <span>Add Item</span>
              </Button>
            </div>

            {/* Render items chips */}
            <div className="flex flex-wrap gap-2 pt-1 min-h-[36px]">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF8EC] border border-[#596B58]/30 text-[#3B302B] text-xs font-semibold rounded-full"
                >
                  <span>{it}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-0.5 rounded-full hover:bg-[#596B58]/20 text-[#596B58] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#3B302B] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Curated hamper bundling artisanal cakes, pastries and accessories."
              className="w-full text-xs p-3 rounded-xl border border-[#E5DEC9] bg-white outline-none focus:border-[#596B58]"
              rows={3}
            />
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveCombo"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-[#596B58] rounded cursor-pointer"
            />
            <label htmlFor="isActiveCombo" className="text-xs font-bold text-[#3B302B] cursor-pointer">
              Publish & make active on Storefront (/combos)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5DEC9]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingCombo ? "Save Changes" : "Create Combo Hamper"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
