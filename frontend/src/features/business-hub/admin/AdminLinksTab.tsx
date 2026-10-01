import React, { useState } from "react";
import {
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Copy,
  Sparkles,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import {
  businessHubService,
  type BusinessLink,
  type LinkType,
} from "@/services/businessHub.service";
import { BusinessHubIcon } from "../components/BusinessHubIcon";
import { toast } from "@/contexts/toast.context";

interface AdminLinksTabProps {
  initialLinks: BusinessLink[];
  onLinksUpdated: (links: BusinessLink[]) => void;
}

const ALL_LINK_TYPES: LinkType[] = [
  "WEBSITE",
  "WHATSAPP",
  "PHONE",
  "MAP",
  "INSTAGRAM",
  "FACEBOOK",
  "YOUTUBE",
  "EMAIL",
  "CUSTOM",
  "PRODUCT",
  "CATEGORY",
  "ABOUT",
  "REVIEWS",
];

const POPULAR_ICONS = [
  "ShoppingBag",
  "MessageCircle",
  "Phone",
  "MapPin",
  "Instagram",
  "Facebook",
  "Youtube",
  "Mail",
  "Cake",
  "Sparkles",
  "Heart",
  "Gift",
  "Star",
  "Info",
  "Globe",
  "Compass",
];

export const AdminLinksTab: React.FC<AdminLinksTabProps> = ({
  initialLinks,
  onLinksUpdated,
}) => {
  const [links, setLinks] = useState<BusinessLink[]>(initialLinks);
  const [editingLink, setEditingLink] = useState<BusinessLink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: LinkType;
    url: string;
    icon: string;
    imageUrl: string;
    isActive: boolean;
    isFeatured: boolean;
    openInNewTab: boolean;
  }>({
    title: "",
    description: "",
    type: "CUSTOM",
    url: "",
    icon: "Globe",
    imageUrl: "",
    isActive: true,
    isFeatured: false,
    openInNewTab: true,
  });

  const [savingLink, setSavingLink] = useState(false);

  const openCreateModal = () => {
    setEditingLink(null);
    setFormData({
      title: "",
      description: "",
      type: "CUSTOM",
      url: "",
      icon: "Cake",
      imageUrl: "",
      isActive: true,
      isFeatured: false,
      openInNewTab: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (link: BusinessLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      description: link.description || "",
      type: link.type,
      url: link.url,
      icon: link.icon || "Globe",
      imageUrl: link.imageUrl || "",
      isActive: link.isActive,
      isFeatured: link.isFeatured,
      openInNewTab: link.openInNewTab,
    });
    setIsModalOpen(true);
  };

  // Reordering helpers
  const moveLink = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const newLinks = [...links];
    const temp = newLinks[index];
    const targetItem = newLinks[targetIndex];
    if (!temp || !targetItem) return;

    newLinks[index] = targetItem;
    newLinks[targetIndex] = temp;

    setLinks(newLinks);
    onLinksUpdated(newLinks);

    try {
      await businessHubService.reorderLinks(newLinks.map((l) => l._id));
      toast.success("Order updated", "Link sequence saved to database.");
    } catch {
      toast.error("Reorder failed", "Could not save link order.");
    }
  };

  // Drag and Drop ordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newLinks = [...links];
    const draggedItem = newLinks[draggedIndex];
    if (!draggedItem) return;

    newLinks.splice(draggedIndex, 1);
    newLinks.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLinks(newLinks);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    onLinksUpdated(links);
    try {
      await businessHubService.reorderLinks(links.map((l) => l._id));
      toast.success("Order updated", "Link order saved.");
    } catch {
      toast.error("Reorder failed", "Could not persist drag order.");
    }
  };

  // Toggle active
  const handleToggleActive = async (link: BusinessLink) => {
    const nextState = !link.isActive;
    const updatedList = links.map((l) =>
      l._id === link._id ? { ...l, isActive: nextState } : l,
    );
    setLinks(updatedList);
    onLinksUpdated(updatedList);

    try {
      await businessHubService.toggleLinkStatus(link._id, nextState);
      toast.success(
        nextState ? "Link enabled" : "Link hidden",
        `"${link.title}" is now ${nextState ? "visible" : "hidden"} on the public page.`,
      );
    } catch {
      toast.error("Update failed", "Could not update status.");
    }
  };

  // Duplicate
  const handleDuplicate = async (link: BusinessLink) => {
    try {
      const duplicated = await businessHubService.duplicateLink(link._id);
      const updatedList = [...links, duplicated];
      setLinks(updatedList);
      onLinksUpdated(updatedList);
      toast.success("Link duplicated", `Created copy of "${link.title}".`);
    } catch {
      toast.error("Duplicate failed", "Could not copy link.");
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await businessHubService.deleteLink(deleteConfirmId);
      const updatedList = links.filter((l) => l._id !== deleteConfirmId);
      setLinks(updatedList);
      onLinksUpdated(updatedList);
      setDeleteConfirmId(null);
      toast.success("Link deleted", "The link has been removed.");
    } catch {
      toast.error("Delete failed", "Could not delete link.");
    }
  };

  // Save Modal Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Security validation on frontend
    const cleanUrl = formData.url.trim().toLowerCase();
    if (cleanUrl.startsWith("javascript:") || cleanUrl.startsWith("data:")) {
      toast.error("Security warning", "Dangerous URL protocols are not allowed.");
      return;
    }

    try {
      setSavingLink(true);
      if (editingLink) {
        const updated = await businessHubService.updateLink(editingLink._id, formData);
        const updatedList = links.map((l) => (l._id === editingLink._id ? updated : l));
        setLinks(updatedList);
        onLinksUpdated(updatedList);
        toast.success("Link updated", `Changes saved to "${updated.title}".`);
      } else {
        const created = await businessHubService.createLink(formData);
        const updatedList = [...links, created];
        setLinks(updatedList);
        onLinksUpdated(updatedList);
        toast.success("Link created", `"${created.title}" added to your business hub.`);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error("Save failed", err instanceof Error ? err.message : "Error saving link.");
    } finally {
      setSavingLink(false);
    }
  };

  // Reset default links
  const handleResetDefaults = async () => {
    try {
      const defaultLinks = await businessHubService.resetDefaultLinks();
      setLinks(defaultLinks);
      onLinksUpdated(defaultLinks);
      setResetConfirmOpen(false);
      toast.success("Defaults restored", "Initial OneBite Bakery links re-populated.");
    } catch {
      toast.error("Reset failed", "Could not restore default links.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Business Links Manager</h3>
          <p className="text-xs text-stone-400">
            Create, reorder, feature, and toggle buttons displayed on your public hub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-xs cursor-pointer"
            title="Reset to default bakery links"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B302B] hover:bg-[#28211D] text-white font-bold text-xs sm:text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Button</span>
          </button>
        </div>
      </div>

      {/* Links List with Drag & Drop */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
        {links.length > 0 ? (
          links.map((link, index) => (
            <div
              key={link._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-200 bg-white ${
                draggedIndex === index
                  ? "opacity-50 border-dashed border-amber-500 scale-[0.98]"
                  : "border-stone-200 hover:border-amber-400"
              }`}
            >
              {/* Left Grip & Info */}
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div
                  className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-600 shrink-0"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-stone-700">
                  <BusinessHubIcon name={link.icon} className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-stone-800 truncate">
                      {link.title}
                    </h4>
                    {link.isFeatured ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                        Featured
                      </span>
                    ) : null}
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                      {link.type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 truncate font-mono">
                    {link.url}
                  </p>
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Reorder Up/Down buttons for mobile & accessibility */}
                <div className="hidden sm:flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveLink(index, "up")}
                    disabled={index === 0}
                    aria-label={`Move ${link.title} up`}
                    className="p-1 rounded-sm text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLink(index, "down")}
                    disabled={index === links.length - 1}
                    aria-label={`Move ${link.title} down`}
                    className="p-1 rounded-sm text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-20 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Active Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(link)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    link.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-stone-100 text-stone-500 border border-stone-200"
                  }`}
                >
                  {link.isActive ? "Active" : "Hidden"}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => openEditModal(link)}
                  className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Edit link"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Duplicate Button */}
                <button
                  type="button"
                  onClick={() => handleDuplicate(link)}
                  className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Duplicate link"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(link._id)}
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-stone-400">
              No custom links available yet. Click "Add New Button" or "Reset Defaults".
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Link Modal */}
      {isModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-800">
                {editingLink ? "Edit Business Link" : "Add New Business Button"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Link Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. 🎂 Birthday Cakes Special"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Subtitle / Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Optional helper text below the title"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Link Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as LinkType,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
                  >
                    {ALL_LINK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, icon: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
                  >
                    {POPULAR_ICONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Destination URL *</label>
                <input
                  type="text"
                  required
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://... or /categories or tel:+91..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Custom Image Thumbnail (Optional)</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  placeholder="https://... or leave empty to use icon"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
                />
              </div>

              <div className="pt-2 flex flex-wrap gap-4 border-t border-stone-100">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                    }
                    className="w-4 h-4 rounded-sm text-[#3B302B] focus:ring-[#3B302B]"
                  />
                  <span className="text-xs font-bold text-stone-700">⭐ Mark as Featured</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.openInNewTab}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, openInNewTab: e.target.checked }))
                    }
                    className="w-4 h-4 rounded-sm text-[#3B302B] focus:ring-[#3B302B]"
                  />
                  <span className="text-xs font-bold text-stone-700">Open in New Tab</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded-sm text-[#3B302B] focus:ring-[#3B302B]"
                  />
                  <span className="text-xs font-bold text-stone-700">Active / Visible</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLink}
                  className="px-6 py-2.5 rounded-xl bg-[#3B302B] hover:bg-[#28211D] text-white text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
                >
                  {savingLink ? "Saving..." : editingLink ? "Update Link" : "Create Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-800">Delete Link?</h3>
            <p className="text-xs text-stone-500">
              Are you sure you want to delete this link? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reset Defaults Confirmation Modal */}
      {resetConfirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-800">Reset Default Links?</h3>
            <p className="text-xs text-stone-500">
              This will restore standard OneBite Bakery shortcuts (Birthday Cakes, WhatsApp, Map, Combos, etc.).
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-5 py-2 rounded-xl bg-[#3B302B] hover:bg-[#28211D] text-white text-xs font-bold"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
