import React, { useEffect, useState } from "react";
import { Check, Layers, RefreshCw, X } from "lucide-react";

import { Badge, Skeleton } from "@/components/ui/DisplayComponents";
import {
  adminBranchProductService,
  type BranchProductMatrixData,
} from "../services/adminBranchProduct.service";

export const AdminBranchMatrixPage: React.FC = () => {
  const [data, setData] = useState<BranchProductMatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const fetchMatrix = async () => {
    try {
      setIsLoading(true);
      const res = await adminBranchProductService.getBranchProductMatrix();
      setData(res);
    } catch (_err) {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleToggleAvailability = async (branchId: string, productId: string, currentAvailable: boolean) => {
    const key = `${branchId}-${productId}`;
    setUpdatingKey(key);
    try {
      await adminBranchProductService.updateBranchProduct(branchId, productId, {
        isAvailable: !currentAvailable,
      });
      await fetchMatrix();
    } catch (_err) {
      // Ignore
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleStockChange = async (branchId: string, productId: string, newStock: number) => {
    const key = `${branchId}-${productId}`;
    setUpdatingKey(key);
    try {
      await adminBranchProductService.updateBranchProduct(branchId, productId, {
        stockQuantity: newStock,
      });
      await fetchMatrix();
    } catch (_err) {
      // Ignore
    } finally {
      setUpdatingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data || data.branches.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-[#3B302B]">No Active Branches Available</h2>
        <p className="text-sm text-[#7A6E65]">Create and activate branches first to manage product matrix.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-[#596B58]" />
            <h1 className="text-2xl font-extrabold text-[#3B302B]">Branch Product Matrix</h1>
          </div>
          <p className="text-xs text-[#7A6E65] mt-1">
            Centralized platform control over per-branch product availability and inventory overrides.
          </p>
        </div>
        <button
          onClick={fetchMatrix}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5DEC9] text-xs font-bold text-[#3B302B] hover:bg-[#FFF8EC] hover:border-[#596B58] transition-all cursor-pointer shadow-2xs"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#596B58]" />
          <span>Refresh Matrix</span>
        </button>
      </div>

      {/* Matrix Table */}
      <div className="bg-white border border-[#E5DEC9] rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FFF8EC] border-b border-[#E5DEC9] text-[#7A6E65] uppercase tracking-wider font-bold">
            <tr>
              <th className="py-4 px-4 min-w-[220px]">Product Details</th>
              <th className="py-4 px-3 text-center min-w-[100px]">Global Status</th>
              {data.branches.map((branch) => (
                <th key={branch.id} className="py-4 px-4 text-center min-w-[160px]">
                  <div className="flex flex-col items-center">
                    <span className="text-[#3B302B] font-extrabold">{branch.name}</span>
                    <span className="text-[10px] text-[#596B58] font-semibold">{branch.code} ({branch.type})</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5DEC9]">
            {data.products.map((prod) => (
              <tr key={prod.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
                {/* Product Name & Details */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.thumbnailUrl}
                      alt={prod.name}
                      className="w-10 h-10 rounded-xl object-cover border border-[#E5DEC9]"
                    />
                    <div>
                      <div className="font-bold text-[#3B302B]">{prod.name}</div>
                      <div className="text-[10px] text-[#7A6E65]">₹{prod.price} &bull; {prod.productType}</div>
                    </div>
                  </div>
                </td>

                {/* Global Status */}
                <td className="py-3 px-3 text-center">
                  {prod.globalIsAvailable ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="danger">Inactive</Badge>
                  )}
                </td>

                {/* Branch Cells */}
                {data.branches.map((branch) => {
                  const key = `${branch.id}-${prod.id}`;
                  const override = data.matrix[prod.id]?.[branch.id];
                  const isAvailable = override ? override.isAvailable : prod.globalIsAvailable;
                  const stockQuantity = override ? override.stockQuantity : 10;
                  const isUpdating = updatingKey === key;

                  return (
                    <td key={branch.id} className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {/* Toggle Availability Button */}
                        <button
                          disabled={isUpdating}
                          onClick={() => handleToggleAvailability(branch.id, prod.id, isAvailable)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                            isAvailable
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          {isAvailable ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <span>{isAvailable ? "Available" : "Disabled"}</span>
                        </button>

                        {/* Stock Quantity Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-[#7A6E65] font-semibold">Stock:</span>
                          <input
                            type="number"
                            min={0}
                            value={stockQuantity}
                            onChange={(e) => handleStockChange(branch.id, prod.id, Number(e.target.value))}
                            className="w-16 h-7 px-1.5 rounded-lg border border-[#E5DEC9] text-[11px] font-bold text-center bg-white focus:outline-none focus:border-[#596B58]"
                          />
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
