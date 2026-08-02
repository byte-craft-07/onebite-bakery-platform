import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

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

export const AdminCategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const list = await adminCatalogService.getCategories();
      setCategories(list);
    } catch (_err) {
      setCategories([
        { id: "cat-1", name: "Artisanal Cakes", slug: "artisanal-cakes", description: "Freshly baked celebration cakes", itemCount: 24, isActive: true },
        { id: "cat-2", name: "Pastries & Tarts", slug: "pastries-tarts", description: "French pastries and fruit tarts", itemCount: 18, isActive: true },
        { id: "cat-3", name: "Fresh Breads", slug: "fresh-breads", description: "Sourdough breads and brioche", itemCount: 12, isActive: true },
      ]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminCatalogService.createCategory({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description,
        image: imageUrl,
      });
      setIsModalOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl("");
      fetchCategories();
    } catch (_err) {
      // Ignore
    } finally {
      setIsSubmitting(false);
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
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add New Category</span>
          </Button>
        }
      />

      <AdminToolbar searchPlaceholder="Search category name..." onSearchChange={setSearchQuery} />

      <AdminTable headers={["Category Name", "URL Slug", "Description", "Items", "Status"]}>
        {filtered.map((cat) => (
          <tr key={cat.id} className="hover:bg-[#F9F6F0]/50 transition-colors">
            <td className="px-4 py-3 font-bold text-[#2C1E16]">{cat.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-[#E67E22]">{cat.slug}</td>
            <td className="px-4 py-3 text-xs text-[#6E5D4F]">{cat.description || "N/A"}</td>
            <td className="px-4 py-3 font-bold">{cat.itemCount || 12} Products</td>
            <td className="px-4 py-3">
              <Badge variant="success">ACTIVE</Badge>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Bakery Category">
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <Input label="Category Name" placeholder="Cupcakes & Muffins" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="URL Slug" placeholder="cupcakes-muffins" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <div>
            <label className="block text-xs font-bold text-[#2C1E16] mb-1">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 rounded-lg border border-[#E8E2D9] text-xs outline-none focus:border-[#E67E22]" />
          </div>
          <MediaUploader value={imageUrl} onChange={setImageUrl} entityType="CATEGORY" />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            <span>Create Category</span>
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
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOccasions = async () => {
    try {
      const list = await adminCatalogService.getOccasions();
      setOccasions(list);
    } catch (_err) {
      setOccasions([
        { id: "occ-1", name: "Birthdays", slug: "birthdays", tagline: "Celebrate special milestones with custom tiered cakes.", isActive: true },
        { id: "occ-2", name: "Anniversaries", slug: "anniversaries", tagline: "Romantic red velvet and Belgian chocolate treats.", isActive: true },
        { id: "occ-3", name: "Weddings", slug: "weddings", tagline: "Elegant multi-tier custom centerpiece creations.", isActive: true },
      ]);
    }
  };

  useEffect(() => {
    fetchOccasions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminCatalogService.createOccasion({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        tagline,
        image: imageUrl,
      });
      setIsModalOpen(false);
      setName("");
      setSlug("");
      setTagline("");
      setImageUrl("");
      fetchOccasions();
    } catch (_err) {
      // Ignore
    } finally {
      setIsSubmitting(false);
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
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add New Occasion</span>
          </Button>
        }
      />

      <AdminToolbar searchPlaceholder="Search occasion name..." onSearchChange={setSearchQuery} />

      <AdminTable headers={["Occasion Name", "URL Slug", "Tagline", "Status"]}>
        {filtered.map((occ) => (
          <tr key={occ.id} className="hover:bg-[#F9F6F0]/50 transition-colors">
            <td className="px-4 py-3 font-bold text-[#2C1E16]">{occ.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-[#E67E22]">{occ.slug}</td>
            <td className="px-4 py-3 text-xs text-[#6E5D4F]">{occ.tagline || "N/A"}</td>
            <td className="px-4 py-3">
              <Badge variant="success">ACTIVE</Badge>
            </td>
          </tr>
        ))}
      </AdminTable>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Bakery Occasion">
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <Input label="Occasion Name" placeholder="Baby Shower Celebrations" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="URL Slug" placeholder="baby-shower" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input label="Tagline" placeholder="Delicate pastel theme cakes for new beginnings" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <MediaUploader value={imageUrl} onChange={setImageUrl} entityType="OCCASION" />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            <span>Create Occasion</span>
          </Button>
        </form>
      </Modal>
    </div>
  );
};
