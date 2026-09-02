import React, { useEffect, useState } from "react";
import { Plus, Tag, Ticket, Trash2, CheckCircle, XCircle } from "lucide-react";

import { Badge, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  AdminTableSkeleton,
  AdminToolbar,
} from "../components/AdminComponents";
import {
  adminCouponsService,
  type AdminCoupon,
  type CreateCouponPayload,
} from "../services/adminCoupons.service";

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | "">("");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const list = await adminCouponsService.getCoupons();
      setCoupons(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CreateCouponPayload = {
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount !== "" ? Number(maxDiscountAmount) : undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(`${endDate}T23:59:59.000Z`).toISOString(),
      usageLimit: usageLimit !== "" ? Number(usageLimit) : undefined,
      isActive,
    };

    try {
      await adminCouponsService.createCoupon(payload);
      setSuccessMessage(`Coupon "${payload.code}" created successfully!`);
      resetForm();
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create coupon code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue(10);
    setMinOrderAmount(0);
    setMaxDiscountAmount("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setUsageLimit("");
    setIsActive(true);
  };

  const handleToggleStatus = async (cpn: AdminCoupon) => {
    try {
      const updated = await adminCouponsService.toggleCouponStatus(cpn.id);
      setCoupons((prev) =>
        prev.map((c) => (c.id === cpn.id ? { ...c, isActive: updated.isActive } : c))
      );
    } catch (_err) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === cpn.id ? { ...c, isActive: !c.isActive } : c))
      );
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;
    try {
      await adminCouponsService.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setSuccessMessage(`Coupon "${couponCode}" deleted.`);
    } catch (_err) {
      // Ignore
    }
  };

  const filtered = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterType === "ACTIVE") return matchesSearch && c.isActive;
    if (filterType === "INACTIVE") return matchesSearch && !c.isActive;
    if (filterType === "PERCENTAGE") return matchesSearch && c.discountType === "PERCENTAGE";
    if (filterType === "FLAT") return matchesSearch && c.discountType === "FLAT";
    return matchesSearch;
  });

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promo & Coupon Code Management"
        description="Create promotional codes, define discount percentages or flat discounts, minimum purchase rules, and monitor redemption limits."
        actions={
          <Button
            onClick={() => {
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Promo Code</span>
          </Button>
        }
      />

      {successMessage ? (
        <div className="p-3 bg-green-50 text-green-800 text-xs font-bold rounded-xl border border-green-200 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <AdminStatCard
          title="Active Promo Codes"
          value={activeCount}
          change={`${coupons.length} Total Codes`}
          isPositive={true}
          icon={<Tag className="h-5 w-5 text-green-600" />}
        />
        <AdminStatCard
          title="Total Redemptions"
          value={totalRedemptions}
          change="Used by Customers"
          isPositive={true}
          icon={<Ticket className="h-5 w-5 text-[#596B58]" />}
        />
        <AdminStatCard
          title="Platform Discount Offers"
          value={coupons.length}
          change="Active Campaigns"
          isPositive={true}
          icon={<Tag className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <AdminToolbar
        searchPlaceholder="Search coupon code or description..."
        onSearchChange={setSearchQuery}
        filterOptions={[
          { label: "All Coupons", value: "ALL" },
          { label: "Active Only", value: "ACTIVE" },
          { label: "Inactive Only", value: "INACTIVE" },
          { label: "Percentage OFF", value: "PERCENTAGE" },
          { label: "Flat Amount OFF", value: "FLAT" },
        ]}
        onFilterChange={setFilterType}
      />

      <AdminTable headers={["Coupon Code", "Discount Offer", "Min Order Subtotal", "Max Cap", "Validity Period", "Usage Count", "Status", "Actions"]}>
        {isLoading ? (
          <AdminTableSkeleton columns={8} rows={4} />
        ) : filtered.length > 0 ? (
          filtered.map((cpn) => (
            <tr key={cpn.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-mono font-extrabold text-sm text-[#3B302B] tracking-wider">
                    {cpn.code}
                  </span>
                  {cpn.description ? (
                    <span className="text-[11px] text-[#7A6E65] truncate max-w-xs">{cpn.description}</span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={cpn.discountType === "PERCENTAGE" ? "warning" : "primary"}>
                  {cpn.discountType === "PERCENTAGE" ? `${cpn.discountValue}% OFF` : `₹${cpn.discountValue} FLAT`}
                </Badge>
              </td>
              <td className="px-4 py-3 font-bold text-xs text-[#3B302B]">
                {cpn.minOrderAmount > 0 ? `₹${cpn.minOrderAmount}` : "No Min Order"}
              </td>
              <td className="px-4 py-3 text-xs text-[#7A6E65]">
                {cpn.maxDiscountAmount ? `₹${cpn.maxDiscountAmount}` : "No Limit"}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                <div>From: {new Date(cpn.startDate).toLocaleDateString()}</div>
                <div>Until: {new Date(cpn.endDate).toLocaleDateString()}</div>
              </td>
              <td className="px-4 py-3 font-mono text-xs font-bold text-[#3B302B]">
                {cpn.usedCount || 0} {cpn.usageLimit ? `/ ${cpn.usageLimit}` : ""}
              </td>
              <td className="px-4 py-3">
                <Badge variant={cpn.isActive ? "success" : "neutral"}>
                  {cpn.isActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(cpn)}
                    title={cpn.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      cpn.isActive
                        ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                        : "border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {cpn.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(cpn.id, cpn.code)}
                    title="Delete Coupon"
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={8} className="text-center py-8 text-xs text-[#7A6E65]">
              No promo codes found matching criteria.
            </td>
          </tr>
        )}
      </AdminTable>

      {/* Modal for Creating New Coupon */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Promo / Coupon Code">
        <form onSubmit={handleCreateCoupon} className="space-y-4 pt-2">
          {errorMessage ? (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Coupon Code *"
              placeholder="e.g. WELCOME100 or SAVE20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />

            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FLAT")}
                className="w-full p-2.5 rounded-lg border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-white font-medium"
              >
                <option value="PERCENTAGE">Percentage Discount (%)</option>
                <option value="FLAT">Flat Amount Discount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={discountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Flat Discount Amount (₹) *"}
              type="number"
              placeholder={discountType === "PERCENTAGE" ? "e.g. 20 for 20%" : "e.g. 100 for ₹100"}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              required
              min={1}
            />

            <Input
              label="Minimum Order Subtotal (₹)"
              type="number"
              placeholder="0 (No Minimum)"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(Number(e.target.value))}
            />
          </div>

          {discountType === "PERCENTAGE" ? (
            <Input
              label="Max Discount Cap Limit (₹) (Optional)"
              type="number"
              placeholder="e.g. 150 (Max cap ₹150 discount)"
              value={maxDiscountAmount}
              onChange={(e) => setMaxDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
            />
          ) : null}

          <div>
            <label className="block text-xs font-bold text-[#3B302B] mb-1">Offer Description</label>
            <input
              type="text"
              placeholder="e.g. Get 20% OFF on all celebration cakes above ₹499"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">Valid From Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">Valid Until Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <Input
              label="Total Redemptions Usage Limit (Optional)"
              type="number"
              placeholder="e.g. 500 (Leave blank for unlimited)"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
            />

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="couponIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[#596B58] rounded"
              />
              <label htmlFor="couponIsActive" className="text-xs font-bold text-[#3B302B] cursor-pointer">
                Publish Code Immediately (Active)
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
            <span>Create & Activate Promo Code</span>
          </Button>
        </form>
      </Modal>
    </div>
  );
};
