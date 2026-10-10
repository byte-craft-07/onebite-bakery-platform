import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Scale } from "lucide-react";

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

const weightOptionSchema = z.object({
  weight: z.string().trim().min(1, "Weight is required."),
  serves: z.string().trim().optional(),
  price: z.coerce.number().min(0, "Valid price >= 0 is required."),
  compareAtPrice: z.coerce.number().optional().nullable(),
});

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Product name is required."),
    nameHi: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    categoryId: z.string().optional(),
    description: z.string().trim().min(2, "Description required."),
    descriptionHi: z.string().trim().optional(),
    productType: z.enum(["NORMAL", "COMBO", "CUSTOM_CAKE", "DECORATION"]).optional(),
    price: z.coerce.number().min(1, "Valid price greater than 0 is required."),
    compareAtPrice: z.coerce.number().optional().nullable(),
    costPrice: z.coerce.number().optional().nullable(),
    sku: z.string().trim().optional(),
    stockQuantity: z.coerce.number().min(0).optional(),
    isEggless: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    isComingSoon: z.boolean().optional(),
    isInstantAvailable: z.boolean().optional(),
    weightOptions: z.array(weightOptionSchema).optional(),
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

export interface WeightOptionRow {
  weight: string;
  serves?: string;
  price: number;
  compareAtPrice?: number;
}

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
  const [weightRows, setWeightRows] = useState<WeightOptionRow[]>([]);
  const prevIsOpenRef = useRef(false);

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
    // Only reset form once when modal transitions from closed to open
    if (isOpen && !prevIsOpenRef.current) {
      setIsManualSlug(!!initialData?.slug);
      if (initialData) {
        form.reset({
          name: initialData.name || "",
          nameHi: initialData.nameHi || "",
          slug: initialData.slug || "",
          categoryId: initialData.categoryId || (typeof initialData.category === "object" ? initialData.category?.id || initialData.category?._id : initialData.category) || "",
          description: initialData.description || "",
          descriptionHi: initialData.descriptionHi || "",
          productType: initialData.productType || "NORMAL",
          price: initialData.price ?? 499,
          compareAtPrice: initialData.compareAtPrice || undefined,
          sku: initialData.sku || "",
          stockQuantity: initialData.stockQuantity ?? 50,
          isEggless: typeof initialData.isEggless === "boolean" ? initialData.isEggless : true,
          isAvailable: typeof initialData.isAvailable === "boolean" ? initialData.isAvailable : true,
          isComingSoon: initialData.isComingSoon ?? false,
          isInstantAvailable: initialData.isInstantAvailable ?? false,
        });

        if (Array.isArray(initialData.weightOptions) && initialData.weightOptions.length > 0) {
          setWeightRows(
            initialData.weightOptions.map((w: any) => ({
              weight: w.weight,
              serves: w.serves || "",
              price: Number(w.price),
              compareAtPrice: w.compareAtPrice ? Number(w.compareAtPrice) : undefined,
            }))
          );
        } else {
          const baseP = Number(initialData.price) || 499;
          const baseC = initialData.compareAtPrice ? Number(initialData.compareAtPrice) : Math.round(baseP * 1.2);
          setWeightRows([
            { weight: "500g", serves: "4-6 slices", price: baseP, compareAtPrice: baseC },
            { weight: "1kg", serves: "10-12 slices", price: Math.round(baseP * 1.8), compareAtPrice: Math.round(baseC * 1.8) },
            { weight: "2kg", serves: "18-22 slices", price: Math.round(baseP * 3.4), compareAtPrice: Math.round(baseC * 3.4) },
          ]);
        }

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
          nameHi: "",
          slug: "",
          categoryId: "",
          description: "",
          descriptionHi: "",
          productType: "NORMAL",
          price: 499,
          compareAtPrice: 599,
          sku: `SKU-${Date.now()}`,
          stockQuantity: 50,
          isEggless: true,
          isAvailable: true,
          isComingSoon: false,
          isInstantAvailable: false,
        });
        setWeightRows([
          { weight: "500g", serves: "4-6 slices", price: 499, compareAtPrice: 599 },
          { weight: "1kg", serves: "10-12 slices", price: 899, compareAtPrice: 1099 },
          { weight: "2kg", serves: "18-22 slices", price: 1699, compareAtPrice: 1999 },
        ]);
        setImageUrls([]);
      }
      setNewImageUrl("");
      setErrorMsg(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData]);

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

  const handleAddWeightRow = () => {
    setWeightRows((prev) => [
      ...prev,
      { weight: "1.5kg", serves: "14-16 slices", price: 1299, compareAtPrice: 1499 },
    ]);
  };

  const handleRemoveWeightRow = (idx: number) => {
    setWeightRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateWeightRow = (idx: number, field: keyof WeightOptionRow, value: any) => {
    setWeightRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        return { ...row, [field]: value };
      })
    );
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

      const finalWeightOptions = weightRows
        .filter((w) => w.weight && w.weight.trim().length > 0 && Number(w.price) >= 0)
        .map((w) => ({
          weight: w.weight.trim(),
          serves: w.serves?.trim() || undefined,
          price: Number(w.price),
          compareAtPrice: w.compareAtPrice && Number(w.compareAtPrice) > 0 ? Number(w.compareAtPrice) : undefined,
        }));

      const payload: CreateProductPayload = {
        name: data.name.trim(),
        nameHi: data.nameHi?.trim() || undefined,
        slug: sanitizedSlug,
        description: data.description.trim(),
        descriptionHi: data.descriptionHi?.trim() || undefined,
        productType: data.productType || "NORMAL",
        price: Number(data.price),
        compareAtPrice:
          data.compareAtPrice && Number(data.compareAtPrice) > 0
            ? Number(data.compareAtPrice)
            : undefined,
        sku: data.sku?.trim() || `SKU-${Date.now()}`,
        stockQuantity: Number(data.stockQuantity ?? 50),
        isEggless: typeof data.isEggless === "boolean" ? data.isEggless : true,
        isAvailable: typeof data.isAvailable === "boolean" ? data.isAvailable : true,
        isComingSoon: Boolean(data.isComingSoon),
        isInstantAvailable: Boolean(data.isInstantAvailable),
        mainImage: finalImages[0],
        thumbnailUrl: finalImages[0],
        imageUrls: finalImages,
        categoryId: data.categoryId?.trim() || undefined,
        weightOptions: finalWeightOptions,
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
            label="Product Name (English) *"
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
          <Input
            label="Product Name (Hindi / हिंदी) (Optional)"
            placeholder="उदा. बेल्जियन ट्रफल केक"
            {...form.register("nameHi")}
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
          <label className="block text-xs font-bold text-[#3B302B] mb-1">Description (English) *</label>
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

        <div>
          <label className="block text-xs font-bold text-[#3B302B] mb-1">Description (Hindi / हिंदी) (Optional)</label>
          <textarea
            rows={2}
            placeholder="रिच बेल्जियन चॉकलेट ट्रफल केक गनाश परतों के साथ..."
            {...form.register("descriptionHi")}
            className="w-full p-3 rounded-lg border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
          />
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

        {/* Weight Options & Multi-Tier Pricing for Cake / Product */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#596B58]" />
              <div>
                <label className="block text-xs font-bold text-[#3B302B]">
                  Weight Options & Pricing (वजन व कीमत विकल्प)
                </label>
                <p className="text-[11px] text-[#7A6E65]">
                  Set specific prices for 500g, 1kg, 2kg, etc. Customers can select weight with dynamic price update.
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
              <span>Add Tier</span>
            </Button>
          </div>

          {weightRows.length > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-[#7A6E65] uppercase px-1">
                <div className="col-span-3">Weight (वजन)</div>
                <div className="col-span-3">Serves (लोग)</div>
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
                      placeholder="e.g. 500g"
                      onChange={(e) => handleUpdateWeightRow(idx, "weight", e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-[#E5DEC9] font-bold text-[#3B302B] outline-none focus:border-[#596B58]"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={row.serves || ""}
                      placeholder="e.g. 4-6 slices"
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
                      onChange={(e) => handleUpdateWeightRow(idx, "compareAtPrice", e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-1.5 text-xs rounded border border-[#E5DEC9] text-gray-400 outline-none focus:border-[#596B58]"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveWeightRow(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
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
              No custom weight tiers added. Base Selling Price will be used.
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
            <Controller
              control={form.control}
              name="isEggless"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-[#3B302B] select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E5DEC9] text-[#596B58] focus:ring-[#596B58] cursor-pointer"
                  />
                  <span>100% Eggless Option (हरा निशान / Pure Veg)</span>
                </label>
              )}
            />

            <Controller
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-[#3B302B] select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E5DEC9] text-[#596B58] focus:ring-[#596B58] cursor-pointer"
                  />
                  <span>Available for Sale</span>
                </label>
              )}
            />

            <Controller
              control={form.control}
              name="isComingSoon"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 select-none hover:bg-amber-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>🚀 Coming Soon (जल्द आ रहा है)</span>
                </label>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="isInstantAvailable"
            render={({ field }) => (
              <label className="flex items-start gap-2.5 text-xs font-medium cursor-pointer p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 hover:bg-amber-100/70 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-400 text-[#596B58] focus:ring-[#596B58] cursor-pointer"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-xs text-[#3B302B] flex items-center gap-1.5">
                    ⚡ Ready to Deliver (Instant)
                  </span>
                  <span className="text-[11px] text-gray-600 font-normal">
                    Check this if the item is already made/in-stock for fast 30-45m instant delivery. Leave unchecked for made-to-order items that require preparation and a specific delivery date/slot.
                  </span>
                </div>
              </label>
            )}
          />
        </div>

        <Button type="submit" className="w-full mt-4" isLoading={isSaving}>
          Save Product & Photos
        </Button>
      </form>
    </Modal>
  );
};
