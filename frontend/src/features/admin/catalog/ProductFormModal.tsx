import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";

import { Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { CustomSelect, Input } from "@/components/ui/FormControls";
import { MediaUploader } from "./MediaUploader";
import { adminCatalogService, type CreateProductPayload } from "../services/adminCatalog.service";

const cleanSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Product name is required."),
    slug: z.string().trim().optional(),
    categoryId: z.string().optional(),
    description: z.string().trim().min(2, "Description required."),
    productType: z.enum(["NORMAL", "COMBO", "CUSTOM_CAKE", "DECORATION"]).optional(),
    price: z.coerce.number().min(1, "Valid price greater than 0 is required."),
    compareAtPrice: z.coerce.number().optional().nullable(),
    costPrice: z.coerce.number().optional().nullable(),
    sku: z.string().trim().optional(),
    stockQuantity: z.coerce.number().min(0).optional(),
    isEggless: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.compareAtPrice && data.price) {
        return Number(data.compareAtPrice) >= Number(data.price);
      }
      return true;
    },
    {
      message: "Compare Price (MRP) must be greater than or equal to Selling Price.",
      path: ["compareAtPrice"],
    }
  );

type ProductFormData = z.infer<typeof productSchema>;

export const ProductFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name?: string) => void;
  initialData?: any;
}> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isManualSlug, setIsManualSlug] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  // Load available categories
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const cats = await adminCatalogService.getCategories();
        if (isMounted && Array.isArray(cats)) {
          setCategories(
            cats.map((c: any) => ({
              id: c.id || c._id,
              name: c.name,
            }))
          );
        }
      } catch (_err) {
        // Ignore fallback
      }
    };
    if (isOpen) {
      loadCategories();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsManualSlug(!!initialData?.slug);
      if (initialData) {
        form.reset({
          name: initialData.name || "",
          slug: initialData.slug || "",
          categoryId: initialData.categoryId || (typeof initialData.category === "object" ? initialData.category?.id || initialData.category?._id : initialData.category) || "",
          description: initialData.description || "",
          productType: initialData.productType || "NORMAL",
          price: initialData.price ?? 499,
          compareAtPrice: initialData.compareAtPrice || undefined,
          sku: initialData.sku || "",
          stockQuantity: initialData.stockQuantity ?? 50,
          isEggless: initialData.isEggless ?? true,
          isAvailable: initialData.isAvailable ?? true,
        });

        const imgs: string[] = [];
        if (Array.isArray(initialData.images) && initialData.images.length > 0) {
          imgs.push(...initialData.images);
        } else if (Array.isArray(initialData.imageUrls) && initialData.imageUrls.length > 0) {
          imgs.push(...initialData.imageUrls);
        }
        if (initialData.mainImage && !imgs.includes(initialData.mainImage)) {
          imgs.unshift(initialData.mainImage);
        } else if (initialData.thumbnailUrl && !imgs.includes(initialData.thumbnailUrl)) {
          imgs.unshift(initialData.thumbnailUrl);
        }
        setImageUrls(imgs.length > 0 ? imgs : []);
      } else {
        form.reset({
          name: "",
          slug: "",
          categoryId: "",
          description: "",
          productType: "NORMAL",
          price: 499,
          compareAtPrice: undefined,
          sku: `SKU-${Date.now()}`,
          stockQuantity: 50,
          isEggless: true,
          isAvailable: true,
        });
        setImageUrls([]);
      }
      setNewImageUrl("");
      setErrorMsg(null);
    }
  }, [isOpen, initialData, form]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    form.setValue("name", val, { shouldValidate: true });
    if (!isManualSlug) {
      form.setValue("slug", cleanSlug(val), { shouldValidate: false });
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualSlug(true);
    form.setValue("slug", cleanSlug(e.target.value), { shouldValidate: true });
  };

  const handleAddImage = (url: string) => {
    if (!url) return;
    if (!imageUrls.includes(url)) {
      setImageUrls((prev) => [...prev, url]);
    }
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (data: ProductFormData) => {
    setErrorMsg(null);
    setIsSaving(true);
    try {
      const finalImages =
        imageUrls.length > 0
          ? imageUrls
          : ["https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"];

      const sanitizedSlug = cleanSlug(data.slug || data.name);

      const payload: CreateProductPayload = {
        name: data.name.trim(),
        slug: sanitizedSlug,
        description: data.description.trim(),
        productType: data.productType || "NORMAL",
        price: Number(data.price),
        compareAtPrice:
          data.compareAtPrice && Number(data.compareAtPrice) > 0
            ? Number(data.compareAtPrice)
            : undefined,
        sku: data.sku?.trim() || `SKU-${Date.now()}`,
        stockQuantity: Number(data.stockQuantity ?? 50),
        isEggless: data.isEggless ?? true,
        isAvailable: data.isAvailable ?? true,
        mainImage: finalImages[0],
        thumbnailUrl: finalImages[0],
        imageUrls: finalImages,
        categoryId: data.categoryId?.trim() || undefined,
      };

      if (initialData?.id) {
        await adminCatalogService.updateProduct(initialData.id, payload);
      } else {
        await adminCatalogService.createProduct(payload);
      }

      onSuccess(data.name);
      onClose();
    } catch (err: any) {
      console.error("Failed to save product:", err);
      let msg = "Failed to save product in backend.";
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        msg = err.response.data.errors
          .map((e: any) => `${e.path?.length ? e.path.join(".") + ": " : ""}${e.message}`)
          .join(" | ");
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const productTypeOptions = [
    { label: "Normal Cake / Pastry", value: "NORMAL" },
    { label: "Combo Hamper Box", value: "COMBO" },
    { label: "Custom Tier Cake", value: "CUSTOM_CAKE" },
    { label: "Party Accessory", value: "DECORATION" },
  ];

  const categoryOptions = [
    { label: "-- Select Category (Optional) --", value: "" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Product Details" : "Create New Product"}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
        {errorMsg ? (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
            {errorMsg}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Product Name *"
            placeholder="Belgian Truffle Cake"
            {...form.register("name")}
            onChange={handleNameChange}
            error={form.formState.errors.name?.message}
          />
          <Input
            label="Slug (URL Friendly) *"
            placeholder="belgian-truffle-cake"
            {...form.register("slug")}
            onChange={handleSlugChange}
            error={form.formState.errors.slug?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <CustomSelect
                label="Category"
                value={field.value || ""}
                onChange={field.onChange}
                options={categoryOptions}
              />
            )}
          />

          <Controller
            control={form.control}
            name="productType"
            render={({ field }) => (
              <CustomSelect
                label="Product Type"
                value={field.value || "NORMAL"}
                onChange={field.onChange}
                options={productTypeOptions}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#3B302B] mb-1">Description *</label>
          <textarea
            rows={3}
            placeholder="Rich Belgian chocolate truffle cake with ganache layers..."
            {...form.register("description")}
            className="w-full p-3 rounded-lg border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
          />
          {form.formState.errors.description?.message ? (
            <p className="text-[11px] text-red-500 font-semibold mt-1">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Selling Price (₹) *"
            type="number"
            {...form.register("price")}
            error={form.formState.errors.price?.message}
          />
          <Input
            label="Compare Price / MRP (₹)"
            type="number"
            {...form.register("compareAtPrice")}
            error={form.formState.errors.compareAtPrice?.message}
          />
          <Input label="SKU Code" {...form.register("sku")} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Initial Stock Quantity"
            type="number"
            {...form.register("stockQuantity")}
          />
        </div>

        {/* Multi-Image Gallery Manager */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9]">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-[#3B302B]">
                Product Photos Gallery ({imageUrls.length} images)
              </label>
              <p className="text-[11px] text-[#7A6E65]">
                Add multiple photos to power auto-changing image carousel & dots
              </p>
            </div>
            {imageUrls.length > 0 && (
              <span className="text-[10px] font-extrabold bg-[#E53935] text-white px-2 py-0.5 rounded-full">
                {imageUrls.length} Added
              </span>
            )}
          </div>

          {/* Existing Images Thumbnails */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#E5DEC9] group bg-white shadow-2xs"
                >
                  <img
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    {idx === 0 ? "Main" : `#${idx + 1}`}
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

          {/* Media Uploader component */}
          <MediaUploader
            value={newImageUrl}
            onChange={(url) => {
              if (url) handleAddImage(url);
            }}
            entityType="PRODUCT"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pt-2">
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              {...form.register("isEggless")}
              className="rounded border-gray-300 text-[#596B58]"
            />
            <span>100% Eggless Option</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              {...form.register("isAvailable")}
              className="rounded border-gray-300 text-[#596B58]"
            />
            <span>Available for Sale</span>
          </label>
        </div>

        <Button type="submit" className="w-full mt-4" isLoading={isSaving}>
          Save Product & Photos
        </Button>
      </form>
    </Modal>
  );
};
