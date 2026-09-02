import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Clock,
  ChefHat,
  Truck,
  CheckCircle,
  AlertTriangle,
  PackageX,
  RefreshCw,
  Building2,
} from "lucide-react";
import { Card, Skeleton, Badge } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth.context";
import {
  adminBranchProductService,
  type BranchDashboardStats,
} from "../services/adminBranchProduct.service";

import { adminBranchService } from "../services/adminBranch.service";

export const BranchAdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const branchId = user?.branchId;

  const [data, setData] = useState<BranchDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    let targetBranchId = branchId;

    if (!targetBranchId) {
      try {
        const allBranches = await adminBranchService.getAllBranches();
        const found = allBranches.find(
          (b) =>
            (b.managerId && b.managerId === user?.id) ||
            (b.managerEmail && user?.email && b.managerEmail.toLowerCase() === user.email.toLowerCase()) ||
            (b.managerPhone && user?.phone && b.managerPhone === user.phone),
        );
        if (found) {
          targetBranchId = found.id;
        }
      } catch (_e) {
        // fallback failed
      }
    }

    if (!targetBranchId) {
      setError("No branch assigned to your account. Please contact Main Admin.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await adminBranchProductService.getBranchDashboardStats(targetBranchId);
      setData(res);
    } catch (_err) {
      setError("Failed to load branch statistics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [branchId, user?.id, user?.email, user?.phone]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 text-red-600 space-y-4">
        <AlertTriangle className="h-10 w-10 mx-auto text-red-500" />
        <p className="font-bold text-sm">{error || "Branch dashboard unavailable."}</p>
        <Button size="sm" onClick={fetchDashboardStats}>
          Try Again
        </Button>
      </div>
    );
  }

  const { branch, stats } = data;

  return (
    <div className="space-y-8 pb-16">
      {/* Branch Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DEC9] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-[#596B58]" />
            <h1 className="text-2xl font-extrabold text-[#3B302B]">
              {branch.name} Operations
            </h1>
            <Badge variant="primary">{branch.type}</Badge>
          </div>
          <p className="text-xs text-[#7A6E65] mt-1">
            Real-time branch inventory, availability, and order status dashboard.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardStats}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Stats</span>
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-[#E5DEC9] space-y-2">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-xs font-semibold">Today's Orders</span>
            <ShoppingBag className="h-4 w-4 text-[#596B58]" />
          </div>
          <div className="text-2xl font-extrabold text-[#3B302B]">
            {stats.todayOrders}
          </div>
          <div className="text-[10px] text-[#7A6E65]">
            Total: {stats.totalOrders ?? stats.todayOrders} orders
          </div>
        </Card>

        <Card className="border-[#E5DEC9] space-y-2">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-xs font-semibold">Pending Approval</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {stats.pendingOrders}
          </div>
          <div className="text-[10px] text-[#7A6E65]">Awaiting action</div>
        </Card>

        <Card className="border-[#E5DEC9] space-y-2">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-xs font-semibold">In Kitchen/Baking</span>
            <ChefHat className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {stats.preparingOrders}
          </div>
          <div className="text-[10px] text-[#7A6E65]">Preparing now</div>
        </Card>

        <Card className="border-[#E5DEC9] space-y-2">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-xs font-semibold">Out for Delivery</span>
            <Truck className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600">
            {stats.outForDelivery}
          </div>
          <div className="text-[10px] text-[#7A6E65]">On the road</div>
        </Card>

        <Card className="border-[#E5DEC9] space-y-2">
          <div className="flex items-center justify-between text-[#7A6E65]">
            <span className="text-xs font-semibold">Delivered</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {stats.deliveredOrders}
          </div>
          <div className="text-[10px] text-[#7A6E65]">Completed</div>
        </Card>
      </div>

      {/* Inventory & Product Operational Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#E5DEC9] space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-[#3B302B]">Low Stock Alerts</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{stats.lowStockProducts}</span>
            <span className="text-xs text-[#7A6E65]">products reaching threshold</span>
          </div>
          <p className="text-xs text-[#7A6E65]">
            Products requiring immediate restock to maintain availability for branch customers.
          </p>
        </Card>

        <Card className="border-[#E5DEC9] space-y-4">
          <div className="flex items-center gap-2">
            <PackageX className="h-5 w-5 text-red-500" />
            <h2 className="text-sm font-bold text-[#3B302B]">Disabled / Unavailable</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600">{stats.unavailableProducts}</span>
            <span className="text-xs text-[#7A6E65]">products hidden from customer catalog</span>
          </div>
          <p className="text-xs text-[#7A6E65]">
            Products disabled for this branch will not appear in village catalog listings.
          </p>
        </Card>
      </div>
    </div>
  );
};
