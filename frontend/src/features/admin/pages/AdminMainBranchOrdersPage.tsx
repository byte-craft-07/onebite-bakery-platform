import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  User,
  X,
  Zap,
} from "lucide-react";

import { Badge, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/FormControls";
import {
  AdminPageHeader,
  AdminTable,
  AdminTableSkeleton,
  AdminToolbar,
} from "../components/AdminComponents";
import {
  adminOperationsService,
  type AdminOrderSummary,
} from "../services/adminOperations.service";

const FALLBACK_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80";

const STATUS_OPTIONS = [
  { label: "PENDING", value: "PENDING" },
  { label: "CONFIRMED", value: "CONFIRMED" },
  { label: "PACKED", value: "PACKED" },
  { label: "OUT FOR DELIVERY", value: "OUT_FOR_DELIVERY" },
  { label: "DELIVERED", value: "DELIVERED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

export const AdminMainBranchOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTiming, setSelectedTiming] = useState<string>("ALL");
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<AdminOrderSummary | null>(null);
  const [kotOrder, setKotOrder] = useState<AdminOrderSummary | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<AdminOrderSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const fetchMainBranchOrders = async () => {
    try {
      setIsRefreshing(true);
      const list = await adminOperationsService.getMainBranchOrders({
        orderStatus: selectedStatus !== "ALL" ? selectedStatus : undefined,
        search: searchQuery || undefined,
      });
      setOrders(list);
    } catch (_err) {
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMainBranchOrders();
  }, [selectedStatus, searchQuery]);

  // Compute Metrics for Main Branch Orders
  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.orderStatus === "PENDING").length;
    const confirmed = orders.filter((o) => o.orderStatus === "CONFIRMED").length;
    const packed = orders.filter((o) =>
      ["PACKED", "PREPARING", "BAKING", "QUALITY_CHECK", "READY", "READY_FOR_PICKUP"].includes(o.orderStatus),
    ).length;
    const outForDelivery = orders.filter((o) => o.orderStatus === "OUT_FOR_DELIVERY").length;
    const delivered = orders.filter((o) => o.orderStatus === "DELIVERED").length;
    const cancelled = orders.filter((o) => o.orderStatus === "CANCELLED").length;
    const totalRevenue = orders
      .filter((o) => o.orderStatus !== "CANCELLED")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      total,
      pending,
      confirmed,
      packed,
      outForDelivery,
      delivered,
      cancelled,
      totalRevenue,
    };
  }, [orders]);

  // Filter orders by delivery timing
  const filteredOrders = useMemo(() => {
    if (selectedTiming === "ALL") return orders;
    return orders.filter((o) => {
      const isInstant = o.deliveryTimingType === "INSTANT" && !o.scheduledDate;
      return selectedTiming === "INSTANT" ? isInstant : !isInstant;
    });
  }, [orders, selectedTiming]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => (o.id || o.orderNumber) === orderId);
    if (!order || order.orderStatus === newStatus) return;

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

      await fetchMainBranchOrders();
      if (selectedOrderForModal && (selectedOrderForModal.id === orderId || selectedOrderForModal.orderNumber === orderId)) {
        setSelectedOrderForModal((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
      }
    } catch (_err) {
      // Ignore
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsDeleting(true);
      await adminOperationsService.deleteOrder(orderId);
      if (selectedOrderForModal && (selectedOrderForModal.id === orderId || selectedOrderForModal.orderNumber === orderId)) {
        setSelectedOrderForModal(null);
      }
      setOrderToDelete(null);
      await fetchMainBranchOrders();
    } catch (_err) {
      // Ignore
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllMainOrders = async () => {
    try {
      setIsDeleting(true);
      for (const ord of filteredOrders) {
        try {
          await adminOperationsService.deleteOrder(ord.id || ord.orderNumber);
        } catch (_e) {
          // Ignore
        }
      }
      setSelectedOrderForModal(null);
      setIsClearAllModalOpen(false);
      await fetchMainBranchOrders();
    } catch (_err) {
      // Ignore
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "success" | "primary" | "danger" | "warning" | "neutral" => {
    switch (status) {
      case "DELIVERED":
        return "success";
      case "OUT_FOR_DELIVERY":
        return "primary";
      case "PREPARING":
      case "BAKING":
      case "QUALITY_CHECK":
      case "PACKED":
        return "warning";
      case "CONFIRMED":
        return "neutral";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Scope Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#3B302B] via-[#4A3B34] to-[#3B302B] p-6 rounded-2xl text-white shadow-lg border border-amber-900/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#596B58] text-white shadow-xs">
              <Building2 className="h-3.5 w-3.5" />
              Main Central Branch
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Franchise Orders Excluded
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Main Branch Orders Console
          </h1>
          <p className="text-xs text-amber-100/70 mt-1 max-w-2xl">
            Live dispatch and baking console for all orders assigned to the Central Main Branch. Franchise branch orders are isolated and not shown here.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchMainBranchOrders}
            disabled={isRefreshing}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#E5DEC9] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Orders</span>
          <span className="text-2xl font-black text-[#3B302B] mt-1 block">{metrics.total}</span>
          <span className="text-[11px] text-gray-500 font-medium">Main branch total</span>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending / New</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{metrics.pending + metrics.confirmed}</span>
          <span className="text-[11px] text-amber-600 font-medium">Needs preparation</span>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Packed</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{metrics.packed}</span>
          <span className="text-[11px] text-blue-600 font-medium">Ready for dispatch</span>
        </div>

        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Out for Delivery</span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">{metrics.outForDelivery}</span>
          <span className="text-[11px] text-purple-600 font-medium">On the road</span>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Delivered</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{metrics.delivered}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Successfully completed</span>
        </div>

        <div className="bg-[#FFF8EC] p-4 rounded-xl border border-[#E5DEC9] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6E65] block">Branch Revenue</span>
          <span className="text-2xl font-black text-[#596B58] mt-1 block">₹{metrics.totalRevenue.toLocaleString("en-IN")}</span>
          <span className="text-[11px] text-gray-500 font-medium">Net revenue</span>
        </div>
      </div>

      {/* Filter Tabs & Delivery Type */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DEC9] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedStatus === st
                  ? "bg-[#596B58] text-white shadow-xs"
                  : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:bg-[#FFF8EC]"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Timing Filter */}
          <div className="flex items-center bg-white border border-[#E5DEC9] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setSelectedTiming("ALL")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedTiming === "ALL" ? "bg-[#596B58] text-white shadow-xs" : "text-gray-600 hover:text-black"
              }`}
            >
              All Timing
            </button>
            <button
              onClick={() => setSelectedTiming("INSTANT")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedTiming === "INSTANT" ? "bg-amber-500 text-white shadow-xs" : "text-gray-600 hover:text-black"
              }`}
            >
              <Zap className="h-3 w-3 text-amber-300" />
              Instant
            </button>
            <button
              onClick={() => setSelectedTiming("SCHEDULED")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                selectedTiming === "SCHEDULED" ? "bg-blue-600 text-white shadow-xs" : "text-gray-600 hover:text-black"
              }`}
            >
              <Calendar className="h-3 w-3" />
              Scheduled
            </button>
          </div>

          {filteredOrders.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsClearAllModalOpen(true)}
              className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar Search */}
      <AdminToolbar
        searchPlaceholder="Search order #, customer name, phone, village or address..."
        onSearchChange={setSearchQuery}
      />

      {/* Main Table */}
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
          <AdminTableSkeleton rows={6} columns={9} />
        ) : filteredOrders.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-12 text-xs text-gray-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <ShoppingBag className="h-8 w-8 text-gray-300" />
                  <span className="font-semibold text-gray-500">No Main Branch orders found.</span>
                  <span className="text-[11px] text-gray-400 max-w-sm">
                    Orders for the main bakery branch will automatically appear here. Franchise branch orders are isolated to their respective franchise views.
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            filteredOrders.map((ord) => {
              const primaryItem = ord.items?.[0];
              const itemCount = ord.items?.length || 1;
              const itemImg =
                (primaryItem as any)?.image ||
                (primaryItem as any)?.thumbnailUrl ||
                (primaryItem as any)?.imageUrl ||
                (primaryItem as any)?.imageUrls?.[0] ||
                (primaryItem as any)?.mainImage ||
                FALLBACK_ITEM_IMAGE;

              const hasCustomCake = ord.items?.some(
                (it) =>
                  it.productName?.toLowerCase().includes("custom") ||
                  it.name?.toLowerCase().includes("custom") ||
                  Boolean(it.customization || it.customCakeConfig),
              );

              const isInstant = ord.deliveryTimingType === "INSTANT" && !hasCustomCake && !ord.scheduledDate;

              return (
                <tr key={ord.id || ord.orderNumber} className="hover:bg-[#FFF8EC]/70 transition-colors">
                  {/* 1. ORDER # */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-xs text-[#3B302B] block">#{ord.orderNumber}</span>
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
                          alt={primaryItem?.productName || primaryItem?.name || "Product"}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_ITEM_IMAGE;
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[#3B302B] truncate block max-w-[150px]">
                          {primaryItem?.productName || primaryItem?.name || "Bakery Item"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {itemCount > 1 && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                              +{itemCount - 1} more
                            </span>
                          )}
                          {hasCustomCake && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                              <Sparkles className="h-2.5 w-2.5" />
                              Custom Cake
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 3. CUSTOMER & MOBILE */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#3B302B] flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400 shrink-0" />
                        {ord.customerName}
                      </span>
                      <a
                        href={`tel:${ord.customerPhone}`}
                        className="text-[11px] font-mono text-[#596B58] hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="h-3 w-3" />
                        {ord.customerPhone}
                      </a>
                    </div>
                  </td>

                  {/* 4. DELIVERY TIMING */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isInstant ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Zap className="h-3 w-3 text-amber-600 fill-amber-600" />
                        Instant (30-45m)
                      </span>
                    ) : (
                      <div className="flex flex-col text-[11px]">
                        <span className="inline-flex items-center gap-1 font-bold text-blue-700">
                          <Calendar className="h-3 w-3" />
                          {ord.scheduledDate
                            ? new Date(ord.scheduledDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })
                            : "Scheduled"}
                        </span>
                        {ord.scheduledTimeSlot && (
                          <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {ord.scheduledTimeSlot}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 5. DELIVERY ADDRESS */}
                  <td className="px-4 py-3 min-w-[160px]">
                    <div className="flex items-start gap-1 text-[11px] text-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <div className="truncate max-w-[180px]">
                        <span className="font-bold text-gray-900 block truncate">
                          {ord.locationSnapshot?.villageName || ord.addressSnapshot?.city || "Hamirpur"}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate block">
                          {ord.addressSnapshot?.street || "Store Delivery"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 6. TOTAL */}
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-xs text-[#3B302B]">
                    ₹{ord.totalAmount?.toLocaleString("en-IN")}
                  </td>

                  {/* 7. PAYMENT */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.paymentStatus || "PAID"}
                    </span>
                  </td>

                  {/* 8. ORDER STAGE WORKFLOW */}
                  <td className="px-4 py-3 whitespace-nowrap min-w-[150px]">
                    <CustomSelect
                      value={ord.orderStatus}
                      onChange={(val) => handleStatusChange(ord.id || ord.orderNumber, val)}
                      options={STATUS_OPTIONS}
                      className="text-xs py-1 px-2 font-bold"
                    />
                  </td>

                  {/* 9. ACTIONS */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrderForModal(ord)}
                        title="View Full Details"
                        className="p-1.5 text-gray-500 hover:text-[#596B58] hover:bg-white rounded-lg border border-[#E5DEC9] transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setKotOrder(ord)}
                        title="Print Kitchen KOT Slip"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-[#E5DEC9] transition-colors cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setOrderToDelete(ord)}
                        title="Delete Order"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </AdminTable>

      {/* MODAL 1: ORDER DETAILS MODAL */}
      {selectedOrderForModal && (
        <Modal
          isOpen={Boolean(selectedOrderForModal)}
          onClose={() => setSelectedOrderForModal(null)}
          title={`Main Branch Order Details #${selectedOrderForModal.orderNumber}`}
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Status & Scope Pill */}
            <div className="flex items-center justify-between p-3 bg-[#FFF8EC] rounded-xl border border-[#E5DEC9]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#3B302B]">Order Status:</span>
                <Badge variant={getStatusBadgeVariant(selectedOrderForModal.orderStatus)}>
                  {selectedOrderForModal.orderStatus}
                </Badge>
              </div>
              <span className="text-[11px] font-semibold text-[#596B58] flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Main Branch Kitchen
              </span>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-[#E5DEC9] rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer Details</span>
                <span className="font-bold text-sm text-[#3B302B] block mt-1">{selectedOrderForModal.customerName}</span>
                <a
                  href={`tel:${selectedOrderForModal.customerPhone}`}
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#596B58] hover:underline mt-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {selectedOrderForModal.customerPhone}
                </a>
              </div>

              <div className="p-3 bg-white border border-[#E5DEC9] rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Delivery Destination</span>
                <span className="font-bold text-xs text-[#3B302B] block mt-1">
                  {selectedOrderForModal.locationSnapshot?.villageName || "Main Central Area"},{" "}
                  {selectedOrderForModal.locationSnapshot?.district || "Hamirpur"}
                </span>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {selectedOrderForModal.addressSnapshot?.street || "Store Delivery"}
                  {selectedOrderForModal.addressSnapshot?.landmark ? ` (Near: ${selectedOrderForModal.addressSnapshot.landmark})` : ""}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-bold text-[#3B302B] uppercase tracking-wider mb-2">Order Items</h4>
              <div className="space-y-2">
                {selectedOrderForModal.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-3 bg-[#FAF8F5] border border-[#E5DEC9] rounded-xl gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-white border border-[#E5DEC9] overflow-hidden shrink-0">
                        <img
                          src={item.image || item.thumbnailUrl || FALLBACK_ITEM_IMAGE}
                          alt={item.productName || item.name || "Item"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#3B302B] block">
                          {item.productName || item.name} &times; {item.quantity}
                        </span>
                        <span className="text-[11px] text-gray-500">₹{item.unitPrice} each</span>

                        {/* Custom Cake Specifications */}
                        {(item.customization || item.customCakeConfig) && (
                          <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-200 text-[11px] space-y-1">
                            <span className="font-bold text-purple-900 block flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-purple-600" />
                              Custom Cake Instructions:
                            </span>
                            {(item.customization?.messageOnCake || item.customCakeConfig?.messageOnCake || item.customization?.message) && (
                              <p className="text-purple-800">
                                <strong className="font-bold">Message on Cake:</strong> &ldquo;
                                {item.customization?.messageOnCake || item.customCakeConfig?.messageOnCake || item.customization?.message}
                                &rdquo;
                              </p>
                            )}
                            {(item.customization?.flavour || item.customCakeConfig?.flavour) && (
                              <p className="text-purple-800">
                                <strong className="font-bold">Flavour:</strong>{" "}
                                {item.customization?.flavour || item.customCakeConfig?.flavour}
                              </p>
                            )}
                            {(item.customization?.eggPreference || item.customCakeConfig?.eggPreference || item.customization?.eggless !== undefined) && (
                              <p className="text-purple-800">
                                <strong className="font-bold">Egg Preference:</strong>{" "}
                                {item.customization?.eggPreference || item.customCakeConfig?.eggPreference || (item.customization?.eggless ? "Eggless (100% Veg)" : "With Egg")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="font-bold text-xs text-[#3B302B] shrink-0">
                      ₹{(item.subtotal || item.itemTotal || item.unitPrice * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-3 bg-[#FFF8EC] rounded-xl border border-[#E5DEC9] flex items-center justify-between">
              <span className="font-bold text-xs text-[#3B302B]">Grand Total Amount</span>
              <span className="font-black text-base text-[#596B58]">
                ₹{selectedOrderForModal.totalAmount?.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DEC9]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKotOrder(selectedOrderForModal)}
                className="text-xs font-bold"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print KOT
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedOrderForModal(null)}
                className="bg-[#596B58] text-white text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: PRINTABLE KOT SLIP */}
      {kotOrder && (
        <Modal
          isOpen={Boolean(kotOrder)}
          onClose={() => setKotOrder(null)}
          title={`Kitchen Order Ticket (KOT) - #${kotOrder.orderNumber}`}
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-white border-2 border-dashed border-gray-400 rounded-xl space-y-3 print:border-black" id="kot-slip">
              <div className="text-center border-b border-gray-300 pb-2">
                <h3 className="font-black text-sm uppercase">ONEBITE BAKERY</h3>
                <span className="text-[10px] font-bold text-gray-600 block">*** MAIN BRANCH CENTRAL KITCHEN ***</span>
                <span className="text-[10px] text-gray-500 block">KITCHEN ORDER TICKET (KOT)</span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span><strong>Order #:</strong> {kotOrder.orderNumber}</span>
                <span><strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span><strong>Customer:</strong> {kotOrder.customerName}</span>
                <span><strong>Timing:</strong> {kotOrder.deliveryTimingType || "Instant"}</span>
              </div>

              {kotOrder.scheduledDate && (
                <div className="text-[11px] bg-amber-50 p-1.5 rounded font-bold text-amber-900">
                  SCHEDULED: {new Date(kotOrder.scheduledDate).toLocaleDateString("en-IN")} ({kotOrder.scheduledTimeSlot || "Standard"})
                </div>
              )}

              <div className="border-t border-b border-gray-300 py-2 space-y-1.5">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>ITEM</span>
                  <span>QTY</span>
                </div>
                {kotOrder.items?.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-bold">{it.productName || it.name}</span>
                      <span>&times; {it.quantity}</span>
                    </div>
                    {(it.customization || it.customCakeConfig) && (
                      <div className="text-[10px] text-purple-900 bg-purple-50 p-1 rounded">
                        * CAKE MSG: {it.customization?.messageOnCake || it.customCakeConfig?.messageOnCake || it.customization?.message || "N/A"}<br />
                        * FLAVOUR: {it.customization?.flavour || it.customCakeConfig?.flavour || "Standard"}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-xs pt-1">
                <span>TOTAL BILLED:</span>
                <span>₹{kotOrder.totalAmount}</span>
              </div>

              <div className="text-center text-[10px] text-gray-400 pt-2 border-t border-gray-200">
                Main Kitchen Dispatch Copy &bull; Onebite Bakery
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="bg-[#596B58] text-white text-xs font-bold"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Print Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKotOrder(null)}
                className="text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      {orderToDelete && (
        <Modal
          isOpen={Boolean(orderToDelete)}
          onClose={() => setOrderToDelete(null)}
          title="Delete Main Branch Order"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Are you sure you want to delete this order?</p>
                <p className="mt-1 text-red-700">
                  Order <strong>#{orderToDelete.orderNumber}</strong> ({orderToDelete.customerName}) will be permanently deleted from the Main Branch records.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDeleteOrder(orderToDelete.id || orderToDelete.orderNumber)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                {isDeleting ? "Deleting..." : "Delete Order"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: CLEAR ALL TEST ORDERS */}
      {isClearAllModalOpen && (
        <Modal
          isOpen={isClearAllModalOpen}
          onClose={() => setIsClearAllModalOpen(false)}
          title="Clear Visible Main Branch Orders"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Clear all visible Main Branch orders?</p>
                <p className="mt-1 text-red-700">
                  This will remove all {filteredOrders.length} visible orders belonging to the Main Branch.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={isDeleting}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleClearAllMainOrders}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                {isDeleting ? "Clearing..." : "Clear Orders"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
