import React, { useEffect, useState } from "react";
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Building2,
} from "lucide-react";
import { Card, Skeleton, Badge } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth.context";
import {
  adminBranchProductService,
  type BranchProductDetails,
} from "../services/adminBranchProduct.service";

import { adminBranchService } from "../services/adminBranch.service";

export const BranchAdminProductsPage: React.FC = () => {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const [activeBranchId, setActiveBranchId] = useState<string | undefined>(branchId);

  const [products, setProducts] = useState<BranchProductDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const resolveBranchId = async () => {
    if (branchId) {
      setActiveBranchId(branchId);
      return branchId;
    }
    try {
      const allBranches = await adminBranchService.getAllBranches();
      const found = allBranches.find(
        (b) =>
          (b.managerId && b.managerId === user?.id) ||
          (b.managerEmail && user?.email && b.managerEmail.toLowerCase() === user.email.toLowerCase()) ||
          (b.managerPhone && user?.phone && b.managerPhone === user.phone),
      );
      if (found) {
        setActiveBranchId(found.id);
        return found.id;
      }
    } catch (_e) {
      // fallback
    }
    return undefined;
  };

  const fetchBranchProducts = async () => {
    const targetBranchId = await resolveBranchId();
    if (!targetBranchId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await adminBranchProductService.getBranchProducts(targetBranchId);
      setProducts(res);
    } catch (_err) {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchProducts();
  }, [branchId, user?.id, user?.email, user?.phone]);

  const handleToggleAvailability = async (item: BranchProductDetails) => {
    const targetBranchId = activeBranchId || (await resolveBranchId());
    if (!targetBranchId) return;
    setSavingProductId(item.productId);
    try {
      const updated = await adminBranchProductService.updateBranchProduct(
        targetBranchId,
        item.productId,
        { isAvailable: !item.isAvailable },
      );
      setProducts((prev) =>
        prev.map((p) => (p.productId === item.productId ? updated : p)),
      );
    } catch (_err) {
      alert("Failed to update product availability.");
    } finally {
      setSavingProductId(null);
    }
  };

  const handleUpdateStock = async (
    item: BranchProductDetails,
    newStock: number,
  ) => {
    if (!branchId || newStock < 0) return;
    setSavingProductId(item.productId);
    try {
      const updated = await adminBranchProductService.updateBranchProduct(
        branchId,
        item.productId,
        { stockQuantity: newStock },
      );
      setProducts((prev) =>
        prev.map((p) => (p.productId === item.productId ? updated : p)),
      );
    } catch (_err) {
      alert("Failed to update stock quantity.");
    } finally {
      setSavingProductId(null);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DEC9] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-[#596B58]" />
            <h1 className="text-2xl font-extrabold text-[#3B302B]">
              Branch Inventory & Availability
            </h1>
          </div>
          <p className="text-xs text-[#7A6E65] mt-1">
            Manage product availability status and stock quantities for your assigned branch.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#E5DEC9]">
        <Search className="h-5 w-5 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {/* Product List Table */}
      <Card className="p-0 border-[#E5DEC9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8EC] text-[#3B302B] font-bold border-b border-[#E5DEC9]">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Global Price</th>
                <th className="p-4">Branch Status</th>
                <th className="p-4">Stock Quantity</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DEC9]">
              {filteredProducts.map((prod) => (
                <tr key={prod.productId} className="hover:bg-amber-50/30 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={prod.thumbnailUrl || "/placeholder.jpg"}
                      alt={prod.productName}
                      className="w-10 h-10 object-cover rounded-lg border border-[#E5DEC9]"
                    />
                    <div>
                      <span className="font-bold text-[#3B302B] block">{prod.productName}</span>
                      <span className="text-[10px] text-[#7A6E65]">Type: {prod.productType}</span>
                    </div>
                  </td>

                  <td className="p-4 font-bold text-[#3B302B]">
                    ₹{prod.globalPrice}
                  </td>

                  <td className="p-4">
                    <Badge variant={prod.isAvailable ? "success" : "danger"}>
                      {prod.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                    </Badge>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        defaultValue={prod.stockQuantity}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val !== prod.stockQuantity) {
                            handleUpdateStock(prod, val);
                          }
                        }}
                        className="w-20 h-8 px-2 rounded-lg border border-[#E5DEC9] font-bold text-xs bg-white text-center focus:outline-none focus:border-[#596B58]"
                      />
                      {prod.stockQuantity <= prod.lowStockThreshold && prod.isAvailable ? (
                        <span title="Low stock warning">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <Button
                      variant={prod.isAvailable ? "danger" : "outline"}
                      size="sm"
                      onClick={() => handleToggleAvailability(prod)}
                      isLoading={savingProductId === prod.productId}
                    >
                      {prod.isAvailable ? "Mark Unavailable" : "Mark Available"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
