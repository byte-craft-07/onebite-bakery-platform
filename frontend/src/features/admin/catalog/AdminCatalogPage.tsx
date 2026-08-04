import React, { useEffect, useState } from "react";

import { catalogService, type ProductItem } from "@/services/catalog.service";
import {
  AdminPageHeader,
  AdminTable,
  AdminTableSkeleton,
  AdminToolbar,
} from "../components/AdminComponents";

export const AdminCatalogPage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await catalogService.searchProducts({ q: searchQuery || undefined, limit: 50 });
      setProducts(res.products);
    } catch (_err) {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Catalog & Inventory Management"
        description="Create, update, soft-delete products, and manage stock quantities."
      />

      <AdminToolbar
        searchPlaceholder="Search products by name or SKU..."
        onSearchChange={setSearchQuery}
      />

      <AdminTable headers={["Image", "Product Name", "SKU", "Price", "Stock Status", "Actions"]}>
        {isLoading ? (
          <AdminTableSkeleton columns={6} rows={5} />
        ) : products.length > 0 ? (
          products.map((p) => (
            <tr key={p.id} className="hover:bg-[#F9F6F0]/50 transition-colors">
              <td className="px-4 py-3">
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 border border-[#E8E2D9]">
                  <img
                    src={p.mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80"}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </td>
              <td className="px-4 py-3 font-bold text-[#2C1E16]">{p.name}</td>
              <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.sku}</td>
              <td className="px-4 py-3 font-extrabold text-[#2C1E16]">₹{p.price}</td>
              <td className="px-4 py-3">
                {p.isAvailable ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">In Stock</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Out of Stock</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-gray-400 font-medium">Read only</span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="text-center py-8 text-xs text-[#6E5D4F]">
              No products found in catalog.
            </td>
          </tr>
        )}
      </AdminTable>
    </div>
  );
};
