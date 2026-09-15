import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import {
  AdminTable,
  AdminTableSkeleton,
  AdminToolbar,
} from "@/features/admin/components/AdminComponents";
import { useAuth } from "@/contexts/auth.context";
import { apiClient } from "@/services/api.client";
import {
  adminBranchProductService,
  type DeliveryAgent,
} from "../services/adminBranchProduct.service";
import {
  adminBranchService,
  type BranchDetails,
} from "../services/adminBranch.service";
import { adminOperationsService } from "../services/adminOperations.service";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: string;
  customization?: {
    message?: string;
    eggless?: boolean;
    flavour?: string;
  };
  customCakeConfig?: {
    messageOnCake?: string;
    eggPreference?: string;
    flavour?: string;
  };
}

const FALLBACK_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80";

interface OrderRecord {
  id: string;
  orderNumber: string;
  orderStatus: "PENDING" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | string;
  deliveryMethod: "HOME_DELIVERY" | "STORE_PICKUP" | string;
  deliveryTimingType?: "INSTANT" | "SCHEDULED" | string;
  deliveryTimePreference?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  customerName?: string;
  customerPhone?: string;
  pricingSnapshot?: {
    grandTotal: number;
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
  };
  totalAmount?: number;
  items: OrderItem[];
  branchSnapshot?: {
    name: string;
    code: string;
  };
  locationSnapshot?: {
    villageName: string;
    district: string;
    pincode: string;
  };
  addressSnapshot?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  deliveryAgentSnapshot?: {
    agentId: string;
    name: string;
    phone?: string;
  };
  createdAt: string;
}

export const BranchAdminOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [branches, setBranches] = useState<BranchDetails[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>("");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderRecord[]>([]);
  const [_agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeOrderModal, setActiveOrderModal] = useState<OrderRecord | null>(null);

  // 1. Fetch all branches and determine active branch
  useEffect(() => {
    const initBranches = async () => {
      try {
        const bList = await adminBranchService.getAllBranches();
        setBranches(bList || []);

        const urlBranchId = searchParams.get("branchId");
        if (urlBranchId && bList.some((b) => b.id === urlBranchId)) {
          setActiveBranchId(urlBranchId);
        } else if (user?.branchId && bList.some((b) => b.id === user.branchId)) {
          setActiveBranchId(user.branchId);
        } else if (bList.length > 0) {
          const mainBranch = bList.find((b) => b.type === "MAIN") || bList[0];
          setActiveBranchId(mainBranch.id);
        }
      } catch (_e) {
        // Ignore
      }
    };
    initBranches();
  }, [user?.branchId, searchParams]);

  // 2. Fetch orders for current active branch
  const fetchOrdersForActiveBranch = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let branchOrders: OrderRecord[] = [];

      if (activeBranchId) {
        try {
          const ordersRes = await apiClient.get<{ success: boolean; data: { orders: OrderRecord[] } }>(
            `/branches/${activeBranchId}/orders`,
            { params: { status: selectedStatus } },
          );
          if (ordersRes.data?.data?.orders && ordersRes.data.data.orders.length > 0) {
            branchOrders = ordersRes.data.data.orders;
          }
        } catch (_err) {
          // Fallback to global orders below
        }

        try {
          const agentsList = await adminBranchProductService.getBranchDeliveryAgents(activeBranchId);
          setAgents(agentsList);
        } catch (_e) {
          setAgents([]);
        }
      }

      if (branchOrders.length === 0 && activeBranchId) {
        const globalOrders = await adminOperationsService.getAllOrders({
          orderStatus: selectedStatus !== "ALL" ? selectedStatus : undefined,
        });

        branchOrders = globalOrders
          .filter((g) => (g.branchSnapshot?.branchId && g.branchSnapshot.branchId === activeBranchId) || (g as any).branchId === activeBranchId)
          .map((g) => ({
          id: g.id,
          orderNumber: g.orderNumber,
          orderStatus: g.orderStatus as any,
          paymentStatus: g.paymentStatus as any,
          deliveryMethod: g.fulfillmentType,
          deliveryTimingType: g.deliveryTimingType,
          deliveryTimePreference: g.deliveryTimePreference,
          scheduledDate: g.scheduledDate,
          scheduledTimeSlot: g.scheduledTimeSlot,
          customerName: g.customerName,
          customerPhone: g.customerPhone,
          totalAmount: g.totalAmount,
          pricingSnapshot: { grandTotal: g.totalAmount },
          items: (g.items || []).map((it) => ({
            productId: it.id || "p-1",
            productName: it.name || it.productName || "Bakery Item",
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 0,
            subtotal: it.itemTotal || it.subtotal || it.unitPrice * it.quantity,
            image: (it as any).image,
            customization: it.customization,
            customCakeConfig: it.customCakeConfig,
          })),
          locationSnapshot: g.locationSnapshot as any,
          addressSnapshot: g.addressSnapshot,
          createdAt: g.createdAt,
        }));
      }

      setOrders(branchOrders);
      setFilteredOrders(branchOrders);
    } catch (_err) {
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersForActiveBranch();
  }, [activeBranchId, selectedStatus]);

  // Filter with search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredOrders(
      orders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.customerPhone?.toLowerCase().includes(q) ||
          o.addressSnapshot?.street?.toLowerCase().includes(q) ||
          o.locationSnapshot?.villageName?.toLowerCase().includes(q) ||
          o.items?.some((it) => it.productName?.toLowerCase().includes(q)),
      ),
    );
  }, [searchQuery, orders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => (o.id || o.orderNumber) === orderId);
    if (!order || order.orderStatus === newStatus) return;

    setUpdatingId(orderId);
    setErrorMsg(null);

    try {
      const fullChain = ["PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

      if (newStatus === "CANCELLED") {
        await adminOperationsService.updateOrderStatus(orderId, "CANCELLED");
      } else {
        const currentIdx = fullChain.indexOf(order.orderStatus);
        const targetIdx = fullChain.indexOf(newStatus);

        if (currentIdx >= 0 && targetIdx > currentIdx) {
          for (let i = currentIdx + 1; i <= targetIdx; i++) {
            await adminOperationsService.updateOrderStatus(orderId, fullChain[i]);
          }
        } else {
          await adminOperationsService.updateOrderStatus(orderId, newStatus);
        }
      }

      await fetchOrdersForActiveBranch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update order status.";
      setErrorMsg(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const selectedBranchObj = branches.find((b) => b.id === activeBranchId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Branch Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E5DEC9] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#FFF8EC] text-[#596B58] flex items-center justify-center border border-[#596B58]/30 shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#3B302B]">
              Branch Order Fulfillment
            </h1>
            <p className="text-xs text-[#7A6E65] mt-0.5">
              Live Kitchen & Dispatch console for{" "}
              <strong className="text-[#596B58]">
                {selectedBranchObj?.name || "Central HQ (Main Branch)"}
              </strong>
            </p>
          </div>
        </div>

        {/* Branch Selector Dropdown & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {branches.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7A6E65] hidden sm:inline">
                Active Branch:
              </span>
              <select
                value={activeBranchId}
                onChange={(e) => {
                  setActiveBranchId(e.target.value);
                  setSearchParams({ branchId: e.target.value });
                }}
                className="h-10 px-3.5 rounded-xl border border-[#E5DEC9] bg-[#FFF8EC] text-xs font-extrabold text-[#3B302B] focus:outline-none focus:border-[#596B58] cursor-pointer shadow-2xs"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏢 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrdersForActiveBranch}
            className="h-10 flex items-center gap-1.5"
            title="Refresh Orders"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-[#7A6E65] shrink-0" />
        {["ALL", "PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedStatus === status
                ? "bg-[#596B58] text-white shadow-xs"
                : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:border-[#596B58]"
            }`}
          >
            {status.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Toolbar with Search */}
      <AdminToolbar
        searchPlaceholder="Search order #, customer name, mobile, product or address..."
        onSearchChange={setSearchQuery}
      />

      {/* Error Alert */}
      {errorMsg ? (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Admin Orders Table */}
      <AdminTable
        headers={[
          "ORDER #",
          "PRODUCT",
          "CUSTOMER & MOBILE",
          "DELIVERY TIMING",
          "DELIVERY ADDRESS",
          "TOTAL",
          "PAYMENT",
          "ORDER STAGE",
          "ACTIONS",
        ]}
      >
        {isLoading ? (
          <AdminTableSkeleton columns={9} rows={5} />
        ) : filteredOrders.length === 0 ? (
          <tr>
            <td colSpan={9} className="text-center py-12 text-xs text-gray-400">
              No orders found matching the selected filter.
            </td>
          </tr>
        ) : (
          filteredOrders.map((ord) => {
            const primaryItem = ord.items?.[0];
            const itemCount = ord.items?.length || 1;
            const itemImg = primaryItem?.image || FALLBACK_ITEM_IMAGE;

            const hasCustomCake = ord.items?.some(
              (it) =>
                it.productName?.toLowerCase().includes("custom") ||
                Boolean(it.customization || it.customCakeConfig),
            );

            const isInstant = ord.deliveryTimingType === "INSTANT" && !hasCustomCake;

            return (
              <tr
                key={ord.id || ord.orderNumber}
                className="hover:bg-[#FFF8EC]/70 transition-colors"
              >
                {/* 1. ORDER # */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono font-bold text-xs text-[#3B302B] block">
                    #{ord.orderNumber || ord.id}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </td>

                {/* 2. PRODUCT WITH IMAGE */}
                <td className="px-4 py-3 min-w-[200px]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-[#FFF8EC] border border-[#E5DEC9] shrink-0">
                      <img
                        src={itemImg}
                        alt={primaryItem?.productName || "Product"}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_ITEM_IMAGE;
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#3B302B] truncate max-w-[150px]">
                        {primaryItem?.productName || "Bakery Item"}
                      </p>
                      <span className="text-[11px] font-extrabold text-[#596B58]">
                        x{primaryItem?.quantity || 1}
                        {itemCount > 1 ? ` (+${itemCount - 1} more)` : ""}
                      </span>
                    </div>
                  </div>
                </td>

                {/* 3. CUSTOMER & MOBILE */}
                <td className="px-4 py-3 min-w-[160px]">
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-[#3B302B] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#596B58] shrink-0" />
                      <span className="truncate max-w-[120px]">
                        {ord.customerName || ord.addressSnapshot?.fullName || "Customer"}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${ord.customerPhone || ord.addressSnapshot?.phone || ""}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A6E65] hover:text-[#596B58]"
                        title="Call Customer"
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        <span>{ord.customerPhone || ord.addressSnapshot?.phone || "N/A"}</span>
                      </a>
                      {ord.customerPhone || ord.addressSnapshot?.phone ? (
                        <a
                          href={`https://wa.me/91${(ord.customerPhone || ord.addressSnapshot?.phone || "").replace(/\D/g, "").slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          title="WhatsApp Customer"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </td>

                {/* 4. DELIVERY TIMING */}
                <td className="px-4 py-3 min-w-[150px]">
                  {isInstant ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 border border-amber-300 text-[11px] font-bold">
                      <Zap className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Instant (30-45m)</span>
                    </span>
                  ) : (
                    <div className="inline-flex flex-col gap-0.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px]">
                      <div className="flex items-center gap-1 font-bold">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>
                          {ord.scheduledDate
                            ? new Date(ord.scheduledDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })
                            : ord.deliveryTimePreference || "Scheduled"}
                        </span>
                      </div>
                      {ord.scheduledTimeSlot ? (
                        <span className="text-[10px] text-blue-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{ord.scheduledTimeSlot}</span>
                        </span>
                      ) : null}
                    </div>
                  )}
                  {hasCustomCake ? (
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      <Sparkles className="h-2.5 w-2.5 text-purple-600" />
                      <span>Custom Cake</span>
                    </div>
                  ) : null}
                </td>

                {/* 5. DELIVERY ADDRESS */}
                <td className="px-4 py-3 max-w-[200px]">
                  {ord.deliveryMethod === "STORE_PICKUP" ? (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      Store Pickup
                    </span>
                  ) : ord.addressSnapshot ? (
                    <div className="space-y-0.5 text-xs">
                      <p className="font-semibold text-[#3B302B] truncate" title={ord.addressSnapshot.street}>
                        {ord.addressSnapshot.street}
                      </p>
                      <p className="text-[10px] text-[#7A6E65] truncate">
                        {ord.addressSnapshot.city || ord.locationSnapshot?.villageName}, {ord.addressSnapshot.pincode}
                      </p>
                    </div>
                  ) : ord.locationSnapshot ? (
                    <div className="space-y-0.5 text-xs">
                      <p className="font-semibold text-[#3B302B] truncate">{ord.locationSnapshot.villageName}</p>
                      <p className="text-[10px] text-[#7A6E65]">{ord.locationSnapshot.district} - {ord.locationSnapshot.pincode}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Address on file</span>
                  )}
                </td>

                {/* 6. TOTAL */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-extrabold text-sm text-[#3B302B]">
                    ₹{ord.pricingSnapshot?.grandTotal ?? ord.totalAmount ?? 0}
                  </span>
                </td>

                {/* 7. PAYMENT */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge
                    variant={
                      ord.paymentStatus === "PAID"
                        ? "success"
                        : ord.paymentStatus === "FAILED"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {ord.paymentStatus}
                  </Badge>
                </td>

                {/* 8. ORDER STAGE */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {ord.orderStatus === "DELIVERED" ? (
                    <span className="px-2.5 py-1 rounded-lg bg-green-100 border border-green-300 text-green-800 font-extrabold text-xs inline-flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="h-3 w-3" />
                      DELIVERED
                    </span>
                  ) : ord.orderStatus === "CANCELLED" ? (
                    <span className="px-2.5 py-1 rounded-lg bg-red-100 border border-red-300 text-red-800 font-extrabold text-xs inline-flex items-center gap-1 shadow-2xs">
                      <X className="h-3 w-3" />
                      CANCELLED
                    </span>
                  ) : (
                    <select
                      disabled={updatingId === ord.id}
                      value={ord.orderStatus}
                      onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-[#E5DEC9] bg-[#FFF8EC] text-xs font-bold text-[#3B302B] focus:outline-none focus:border-[#596B58] cursor-pointer shadow-2xs"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PACKED">PACKED</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  )}
                </td>

                {/* 9. ACTIONS */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveOrderModal(ord)}
                    className="h-8 px-2.5 flex items-center gap-1 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#596B58]" />
                    <span>Details</span>
                  </Button>
                </td>
              </tr>
            );
          })
        )}
      </AdminTable>

      {/* Details Modal */}
      {activeOrderModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E5DEC9] rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DEC9]">
              <div>
                <h3 className="text-lg font-extrabold text-[#3B302B]">
                  Order #{activeOrderModal.orderNumber || activeOrderModal.id}
                </h3>
                <p className="text-xs text-[#7A6E65] mt-0.5">
                  Placed on {new Date(activeOrderModal.createdAt).toLocaleString()} &bull;{" "}
                  <span className="font-bold text-[#596B58]">{activeOrderModal.deliveryMethod}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveOrderModal(null)}
                className="p-2 rounded-xl text-[#7A6E65] hover:bg-[#FFF8EC] hover:text-[#3B302B] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer & Destination Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-1">
                <p className="font-bold text-[#3B302B]">Customer Information</p>
                <p className="text-[#7A6E65]">{activeOrderModal.customerName || "Customer"}</p>
                <p className="text-[#7A6E65] font-mono">{activeOrderModal.customerPhone || "N/A"}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-1">
                <p className="font-bold text-[#3B302B]">Delivery Destination</p>
                {activeOrderModal.addressSnapshot ? (
                  <p className="text-[#7A6E65]">
                    {activeOrderModal.addressSnapshot.street},{" "}
                    {activeOrderModal.addressSnapshot.city || activeOrderModal.locationSnapshot?.villageName},{" "}
                    {activeOrderModal.addressSnapshot.pincode}
                  </p>
                ) : (
                  <p className="text-[#7A6E65]">
                    {activeOrderModal.locationSnapshot?.villageName},{" "}
                    {activeOrderModal.locationSnapshot?.district}
                  </p>
                )}
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-[#3B302B]">Order Items:</h4>
              <div className="space-y-2">
                {activeOrderModal.items?.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-white border border-[#E5DEC9] shrink-0">
                        <img
                          src={it.image || FALLBACK_ITEM_IMAGE}
                          alt={it.productName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#3B302B]">{it.productName}</p>
                        {it.customization?.message || it.customCakeConfig?.messageOnCake ? (
                          <p className="text-[10px] text-[#596B58] font-semibold">
                            Inscription: "{it.customization?.message || it.customCakeConfig?.messageOnCake}"
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#3B302B]">x{it.quantity}</p>
                      <p className="font-extrabold text-[#596B58]">₹{it.subtotal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#3B302B]">Grand Total</span>
              <span className="font-extrabold text-lg text-[#596B58]">
                ₹{activeOrderModal.pricingSnapshot?.grandTotal ?? activeOrderModal.totalAmount ?? 0}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveOrderModal(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
