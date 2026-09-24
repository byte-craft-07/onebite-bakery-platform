import React, { useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";

import { Badge, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from "../components/AdminComponents";
import { MediaUploader } from "./MediaUploader";
import { adminCatalogService } from "../services/adminCatalog.service";

const cleanSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const extractErrorMessage = (err: any, fallback: string): string => {
  if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
    const errorDetails = err.response.data.errors
      .map((e: any) => e.message || e.msg)
      .filter(Boolean)
      .join(", ");
    if (errorDetails) return errorDetails;
  }
  return err?.response?.data?.message || err?.message || fallback;
};

export const AdminCategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const list = await adminCatalogService.getCategories();
      setCategories(list);
    } catch (_err) {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCat(null);
    setName("");
    setSlug("");
    setIsManualSlug(false);
    setDescription("");
    setImageUrl("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCat(cat);
    setName(cat.name || "");
    setSlug(cat.slug || "");
    setIsManualSlug(true);
    setDescription(cat.description || "");
    setImageUrl(cat.image || cat.bannerImage || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isManualSlug) {
      setSlug(cleanSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsManualSlug(true);
    setSlug(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const formattedSlug = cleanSlug(slug || name);

    const payload = {
      name: name.trim(),
      slug: formattedSlug || cleanSlug(name),
      description: description.trim() || `${name.trim()} category from Onebite Bakery.`,
      image: imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    };

    try {
      if (editingCat?.id) {
        await adminCatalogService.updateCategory(editingCat.id, payload);
      } else {
        await adminCatalogService.createCategory(payload);
      }
      await fetchCategories();
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, "Failed to save category."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await adminCatalogService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (_err) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Category Management"
        description="Organize bakery products into customer browsing categories."
        actions={
          <Button onClick={handleOpenCreate} className="bg-[#596B58] hover:bg-[#495948] text-white">
            + Add Category
          </Button>
        }
      />

      <AdminToolbar
        searchPlaceholder="Search category name..."
        onSearchChange={setSearchQuery}
        actions={
          <Button onClick={handleOpenCreate} className="bg-[#596B58] hover:bg-[#495948] text-white sm:hidden">
            + Add Category
          </Button>
        }
      />

      <AdminTable headers={["Category Name", "URL Slug", "Description", "Status", "Actions"]}>
        {filtered.map((cat) => (
          <tr key={cat.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
            <td className="px-4 py-3 font-bold text-[#3B302B]">{cat.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-[#596B58]">{cat.slug}</td>
            <td className="px-4 py-3 text-xs text-[#7A6E65]">{cat.description || "N/A"}</td>
            <td className="px-4 py-3">
              <Badge variant="success">ACTIVE</Badge>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1 rounded border border-[#E5DEC9] text-[#596B58] hover:bg-[#FFF8EC] transition-colors cursor-pointer"
                  title="Edit Category"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCat ? "Edit Bakery Category" : "Create Bakery Category"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg ? (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
              {errorMsg}
            </div>
          ) : null}

          <Input label="Category Name" placeholder="Cupcakes & Muffins" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
          <Input label="URL Slug" placeholder="cupcakes-muffins" value={slug} onChange={(e) => handleSlugChange(e.target.value)} />
          <div>
            <label className="block text-xs font-bold text-[#3B302B] mb-1">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 rounded-lg border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]" />
          </div>
          <MediaUploader value={imageUrl} onChange={setImageUrl} entityType="CATEGORY" />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            <span>{editingCat ? "Save Changes" : "Create Category"}</span>
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export const AdminOccasionPage: React.FC = () => {
  const [occasions, setOccasions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOcc, setEditingOcc] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [tagline, setTagline] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOccasions = async () => {
    try {
      const list = await adminCatalogService.getOccasions();
      setOccasions(list);
    } catch (_err) {
      setOccasions([]);
    }
  };

  useEffect(() => {
    fetchOccasions();
  }, []);

  const handleOpenCreate = () => {
    setEditingOcc(null);
    setName("");
    setSlug("");
    setIsManualSlug(false);
    setTagline("");
    setImageUrl("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (occ: any) => {
    setEditingOcc(occ);
    setName(occ.name || "");
    setSlug(occ.slug || "");
    setIsManualSlug(true);
    setTagline(occ.tagline || occ.description || "");
    setImageUrl(occ.bannerImage || occ.image || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isManualSlug) {
      setSlug(cleanSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsManualSlug(true);
    setSlug(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const formattedSlug = cleanSlug(slug || name);

    const payload = {
      name: name.trim(),
      slug: formattedSlug || cleanSlug(name),
      tagline: tagline.trim(),
      description: tagline.trim() || `${name.trim()} celebration occasion cakes and desserts`,
      bannerImage: imageUrl || "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80",
    };

    try {
      if (editingOcc?.id) {
        await adminCatalogService.updateOccasion(editingOcc.id, payload);
      } else {
        await adminCatalogService.createOccasion(payload);
      }
      await fetchOccasions();
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, "Failed to save occasion."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOccasion = async (id: string) => {
    if (!window.confirm("Delete this occasion?")) return;
    try {
      await adminCatalogService.deleteOccasion(id);
      setOccasions((prev) => prev.filter((o) => o.id !== id));
    } catch (_err) {
      setOccasions((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const filtered = occasions.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Occasion Management"
        description="Manage celebration occasion categories (Birthdays, Weddings, Anniversaries)."
        actions={
          <Button onClick={handleOpenCreate} className="bg-[#596B58] hover:bg-[#495948] text-white">
            + Add Occasion
          </Button>
        }
      />

      <AdminToolbar
        searchPlaceholder="Search occasion name..."
        onSearchChange={setSearchQuery}
        actions={
          <Button onClick={handleOpenCreate} className="bg-[#596B58] hover:bg-[#495948] text-white sm:hidden">
            + Add Occasion
          </Button>
        }
      />

      <AdminTable headers={["Occasion Name", "URL Slug", "Tagline", "Status", "Actions"]}>
        {filtered.map((occ) => (
          <tr key={occ.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
            <td className="px-4 py-3 font-bold text-[#3B302B]">{occ.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-[#596B58]">{occ.slug}</td>
            <td className="px-4 py-3 text-xs text-[#7A6E65]">{occ.tagline || occ.description || "N/A"}</td>
            <td className="px-4 py-3">
              <Badge variant="success">ACTIVE</Badge>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(occ)}
                  className="p-1 rounded border border-[#E5DEC9] text-[#596B58] hover:bg-[#FFF8EC] transition-colors cursor-pointer"
                  title="Edit Occasion"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteOccasion(occ.id)}
                  className="p-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Occasion"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOcc ? "Edit Bakery Occasion" : "Create Bakery Occasion"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg ? (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
              {errorMsg}
            </div>
          ) : null}

          <Input label="Occasion Name" placeholder="Baby Shower Celebrations" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
          <Input label="URL Slug" placeholder="baby-shower" value={slug} onChange={(e) => handleSlugChange(e.target.value)} />
          <Input label="Tagline" placeholder="Delicate pastel theme cakes for new beginnings" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <MediaUploader value={imageUrl} onChange={setImageUrl} entityType="OCCASION" />
          <Button type="submit" className="w-full text-white bg-[#596B58] hover:bg-[#495948] h-11 font-bold rounded-xl" isLoading={isSubmitting}>
            <span>{editingOcc ? "Save Changes" : "Create Occasion"}</span>
          </Button>
        </form>
      </Modal>
    </div>
  );
};
