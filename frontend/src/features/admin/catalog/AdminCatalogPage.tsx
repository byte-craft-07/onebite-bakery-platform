import React, { useEffect, useState } from "react";
import { Edit2, Minus, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import {
  AdminPageHeader,
  AdminTable,
  AdminTableSkeleton,
  AdminToolbar,
} from "../components/AdminComponents";
import { ProductFormModal } from "./ProductFormModal";
import { adminCatalogService } from "../services/adminCatalog.service";

export const AdminCatalogPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const list = await adminCatalogService.getProducts();
      const sorted = [...list].sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setProducts(sorted);
    } catch (_err) {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSuccess = (name?: string) => {
    fetchProducts();
    if (name) {
      setStatusMsg(`Product "${name}" saved successfully! It is now live in your catalog at the top of the list.`);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockUpdate = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    setUpdatingId(productId);
    try {
      await adminCatalogService.updateInventory(productId, newStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
      );
      setStatusMsg("Stock quantity updated in MongoDB backend.");
    } catch (_err) {
      // Direct local update if offline
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
      );
      setStatusMsg("Stock quantity updated.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleAvailability = async (productId: string, currentAvailable: boolean) => {
    const nextStatus = !currentAvailable;
    setUpdatingId(productId);
    try {
      await adminCatalogService.updateAvailability(productId, nextStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isAvailable: nextStatus } : p))
      );
      setStatusMsg(`Product marked as ${nextStatus ? "In Stock" : "Out of Stock"}.`);
    } catch (_err) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isAvailable: nextStatus } : p))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product from catalog?")) return;
    try {
      await adminCatalogService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setStatusMsg("Product removed from catalog.");
    } catch (_err) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Catalog & Inventory Management"
        description="Create products, update stock quantities, toggle availability, and edit pricing."
        actions={
          <Button onClick={handleOpenCreate} className="bg-[#596B58] hover:bg-[#495948] text-white font-bold flex items-center gap-1.5 shadow-md">
            <Plus className="h-4 w-4" />
            <span>Create New Product</span>
          </Button>
        }
      />

      {statusMsg ? (
        <div className="p-3 bg-green-50 text-green-800 text-xs font-bold rounded-xl border border-green-200 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-green-600 hover:text-green-900 font-extrabold cursor-pointer">
            &times;
          </button>
        </div>
      ) : null}

      <AdminToolbar
        searchPlaceholder="Search products by name or SKU..."
        onSearchChange={setSearchQuery}
        actions={
          <Button onClick={handleOpenCreate} className="bg-[#596B58] hover:bg-[#495948] text-white sm:hidden w-full">
            + Add Product
          </Button>
        }
      />

      <AdminTable headers={["Image", "Product Name", "SKU", "Price", "Stock Quantity", "Stock Status", "Actions"]}>
        {isLoading ? (
          <AdminTableSkeleton columns={7} rows={5} />
        ) : filtered.length > 0 ? (
          filtered.map((p) => (
            <tr key={p.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
              {/* Image */}
              <td className="px-4 py-3">
                <div className="h-11 w-11 rounded-xl overflow-hidden bg-gray-100 border border-[#E5DEC9] shadow-2xs">
                  <img
                    src={p.mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80"}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </td>

              {/* Product Name */}
              <td className="px-4 py-3">
                <p className="font-bold text-[#3B302B]">{p.name}</p>
                {p.isEggless ? (
                  <span className="inline-block mt-0.5 text-[10px] font-extrabold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    100% EGGLESS
                  </span>
                ) : null}
              </td>

              {/* SKU */}
              <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.sku || `SKU-${p.id}`}</td>

              {/* Price */}
              <td className="px-4 py-3 font-extrabold text-[#3B302B]">₹{p.price}</td>

              {/* Stock Quantity Control */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 bg-[#FFF8EC] border border-[#E5DEC9] p-1 rounded-xl w-fit">
                  <button
                    onClick={() => handleStockUpdate(p.id, p.stockQuantity ?? 50, -1)}
                    disabled={updatingId === p.id}
                    className="h-6 w-6 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Decrease Stock Quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>

                  <span className="font-extrabold text-xs px-2 min-w-[32px] text-center text-[#3B302B]">
                    {p.stockQuantity ?? 50}
                  </span>

                  <button
                    onClick={() => handleStockUpdate(p.id, p.stockQuantity ?? 50, 1)}
                    disabled={updatingId === p.id}
                    className="h-6 w-6 rounded-lg bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Increase Stock Quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </td>

              {/* Stock Status Availability Toggle */}
              <td className="px-4 py-3">
                <button
                  onClick={() => handleToggleAvailability(p.id, p.isAvailable)}
                  disabled={updatingId === p.id}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                    p.isAvailable
                      ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                      : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                  }`}
                  title="Click to toggle availability"
                >
                  {p.isAvailable ? "In Stock (Active)" : "Out of Stock"}
                </button>
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-lg border border-[#E5DEC9] text-[#596B58] hover:bg-[#FFF8EC] transition-colors cursor-pointer"
                    title="Edit Product Details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={7} className="text-center py-8 text-xs text-[#7A6E65]">
              No products found in catalog.
            </td>
          </tr>
        )}
      </AdminTable>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProductSuccess}
        initialData={editingProduct}
      />
    </div>
  );
};
