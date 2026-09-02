import React, { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";

const FALLBACK_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80";

import { Badge, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/FormControls";
import {
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from "../components/AdminComponents";
import {
  adminOperationsService,
  type AdminOrderSummary,
} from "../services/adminOperations.service";

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<AdminOrderSummary | null>(null);

  const fetchOrders = async () => {
    try {
      const list = await adminOperationsService.getAllOrders({
        orderStatus: selectedStatus !== "ALL" ? selectedStatus : undefined,
        search: searchQuery || undefined,
      });
      setOrders(list);
    } catch (_err) {
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, searchQuery]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => (o.id || o.orderNumber) === orderId);
    if (!order || order.orderStatus === newStatus) return;

    try {
      const fullChain = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

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

      fetchOrders();
      if (selectedOrderForModal && (selectedOrderForModal.id === orderId || selectedOrderForModal.orderNumber === orderId)) {
        setSelectedOrderForModal((prev) => prev ? { ...prev, orderStatus: newStatus } : null);
      }
    } catch (_err) {
      // Ignore
    }
  };

  const statusOptions = [
    { label: "PENDING", value: "PENDING" },
    { label: "CONFIRMED", value: "CONFIRMED" },
    { label: "PREPARING", value: "PREPARING" },
    { label: "BAKING", value: "BAKING" },
    { label: "QUALITY CHECK", value: "QUALITY_CHECK" },
    { label: "PACKED", value: "PACKED" },
    { label: "OUT FOR DELIVERY", value: "OUT_FOR_DELIVERY" },
    { label: "DELIVERED", value: "DELIVERED" },
    { label: "CANCELLED", value: "CANCELLED" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Order Management & Dispatch Console"
        description="Monitor real-time customer orders with delivery timing requirements, customer contact details, delivery addresses, and baking stages."
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5DEC9] pb-4">
        {["ALL", "PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedStatus === st
                ? "bg-[#596B58] text-white shadow-xs"
                : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:bg-[#FFF8EC]"
            }`}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <AdminToolbar
        searchPlaceholder="Search order #, customer name, phone, village or address..."
        onSearchChange={setSearchQuery}
      />

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
        {orders.length === 0 ? (
          <tr>
            <td colSpan={9} className="text-center py-10 text-xs text-gray-400">
              No orders found matching the filter criteria.
            </td>
          </tr>
        ) : (
          orders.map((ord) => {
            const primaryItem = ord.items?.[0];
            const itemCount = ord.items?.length || 1;
            const itemImg = (primaryItem as any)?.image || FALLBACK_ITEM_IMAGE;

            const hasCustomCake = ord.items?.some(
              (it) =>
                it.productName?.toLowerCase().includes("custom") ||
                it.name?.toLowerCase().includes("custom") ||
                Boolean(it.customization || it.customCakeConfig),
            );

            const isInstant = ord.deliveryTimingType === "INSTANT" && !hasCustomCake;

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
                      <p className="font-bold text-xs text-[#3B302B] truncate max-w-[150px]">
                        {primaryItem?.productName || primaryItem?.name || "Bakery Item"}
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
                      <span className="truncate max-w-[120px]">{ord.customerName}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${ord.customerPhone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A6E65] hover:text-[#596B58]"
                        title="Call Customer"
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        <span>{ord.customerPhone}</span>
                      </a>
                      {ord.customerPhone && ord.customerPhone !== "N/A" ? (
                        <a
                          href={`https://wa.me/91${ord.customerPhone.replace(/\D/g, "").slice(-10)}`}
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
                  <div className="space-y-1">
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
                            <span>{ord.scheduledTimeSlot.split(" ")[0]} {ord.scheduledTimeSlot.split(" ")[1] || ""}</span>
                          </span>
                        ) : null}
                      </div>
                    )}
                    {hasCustomCake ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        <Sparkles className="h-3 w-3 text-purple-600" />
                        <span>Custom Cake</span>
                      </div>
                    ) : null}
                  </div>
                </td>

                {/* 5. DELIVERY ADDRESS */}
                <td className="px-4 py-3 max-w-[200px]">
                  {ord.fulfillmentType === "STORE_PICKUP" ? (
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
                      {ord.addressSnapshot.landmark ? (
                        <p className="text-[9px] text-gray-400 italic truncate">Near: {ord.addressSnapshot.landmark}</p>
                      ) : null}
                    </div>
                  ) : ord.locationSnapshot ? (
                    <div className="text-xs text-[#7A6E65]">
                      <p className="font-semibold text-[#3B302B] truncate">{ord.locationSnapshot.villageName}</p>
                      <p className="text-[10px]">{ord.locationSnapshot.district} - {ord.locationSnapshot.pincode}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Address on File</span>
                  )}
                </td>

                {/* 6. TOTAL */}
                <td className="px-4 py-3 font-extrabold text-sm text-[#3B302B] whitespace-nowrap">
                  ₹{ord.totalAmount}
                </td>

                {/* 7. PAYMENT */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant={ord.paymentStatus === "PAID" ? "success" : "warning"}>
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
                    <CustomSelect
                      value={ord.orderStatus}
                      onChange={(newVal) => handleStatusChange(ord.id || ord.orderNumber, newVal)}
                      options={statusOptions}
                      className="h-8 text-[11px] min-w-[140px]"
                    />
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrderForModal(ord)}
                    className="h-8 text-xs font-bold border-[#E5DEC9] hover:bg-[#FFF8EC] hover:text-[#596B58]"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    <span>Details</span>
                  </Button>
                </td>
              </tr>
            );
          })
        )}
      </AdminTable>

      {/* Interactive Order Details Inspection Modal */}
      {selectedOrderForModal ? (
        <Modal
          isOpen={Boolean(selectedOrderForModal)}
          onClose={() => setSelectedOrderForModal(null)}
          title={`Order #${selectedOrderForModal.orderNumber} - Full Details`}
        >
          <div className="space-y-5 pt-2">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#7A6E65] uppercase tracking-wider">Order Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedOrderForModal.orderStatus === "DELIVERED" ? "success" : "primary"}>
                    {selectedOrderForModal.orderStatus}
                  </Badge>
                  <Badge variant={selectedOrderForModal.paymentStatus === "PAID" ? "success" : "warning"}>
                    Payment: {selectedOrderForModal.paymentStatus}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-[#7A6E65] uppercase tracking-wider">Total Amount</span>
                <p className="text-2xl font-black text-[#596B58]">₹{selectedOrderForModal.totalAmount}</p>
              </div>
            </div>

            {/* Customer & Delivery Timing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Contact */}
              <div className="p-4 rounded-2xl border border-[#E5DEC9] bg-white space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#3B302B] pb-1 border-b border-[#E5DEC9]">
                  <User className="h-4 w-4 text-[#596B58]" />
                  <span>Customer Contact</span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-[#3B302B]">{selectedOrderForModal.customerName}</p>
                  <p className="text-[#7A6E65] flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-bold">{selectedOrderForModal.customerPhone}</span>
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`tel:${selectedOrderForModal.customerPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Call Now</span>
                    </a>
                    {selectedOrderForModal.customerPhone && selectedOrderForModal.customerPhone !== "N/A" ? (
                      <a
                        href={`https://wa.me/91${selectedOrderForModal.customerPhone.replace(/\D/g, "").slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors inline-flex items-center gap-1"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Delivery Timing Preference */}
              <div className="p-4 rounded-2xl border border-[#E5DEC9] bg-white space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#3B302B] pb-1 border-b border-[#E5DEC9]">
                  <Clock className="h-4 w-4 text-[#596B58]" />
                  <span>Delivery Timing Requirement</span>
                </div>
                <div className="text-xs space-y-1.5">
                  <p className="font-bold text-sm text-[#3B302B]">
                    {selectedOrderForModal.deliveryTimePreference ||
                      (selectedOrderForModal.deliveryTimingType === "INSTANT"
                        ? "⚡ Instant Delivery (Within 30-45 mins)"
                        : `📅 Scheduled: ${selectedOrderForModal.scheduledDate} (${selectedOrderForModal.scheduledTimeSlot || ""})`)}
                  </p>
                  <p className="text-[11px] text-[#7A6E65]">
                    Fulfillment: <strong>{selectedOrderForModal.fulfillmentType}</strong>
                  </p>
                  {selectedOrderForModal.deliveryTimingType === "INSTANT" ? (
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md">
                      Dispatched with high priority
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-md">
                      Scheduled Delivery
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="p-4 rounded-2xl border border-[#E5DEC9] bg-white space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[#3B302B] pb-1 border-b border-[#E5DEC9]">
                <MapPin className="h-4 w-4 text-[#596B58]" />
                <span>Complete Delivery Address</span>
              </div>
              {selectedOrderForModal.fulfillmentType === "STORE_PICKUP" ? (
                <p className="text-xs text-gray-500 font-medium">Customer requested Store Pickup at the main bakery counter.</p>
              ) : selectedOrderForModal.addressSnapshot ? (
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#3B302B]">{selectedOrderForModal.addressSnapshot.fullName} ({selectedOrderForModal.addressSnapshot.phone})</p>
                  <p className="text-[#7A6E65]">{selectedOrderForModal.addressSnapshot.street}</p>
                  <p className="text-[#7A6E65]">
                    {selectedOrderForModal.addressSnapshot.city}, {selectedOrderForModal.addressSnapshot.state} - {selectedOrderForModal.addressSnapshot.pincode}
                  </p>
                  {selectedOrderForModal.addressSnapshot.landmark ? (
                    <p className="text-[11px] text-amber-800 font-semibold">
                      Landmark: {selectedOrderForModal.addressSnapshot.landmark}
                    </p>
                  ) : null}
                </div>
              ) : selectedOrderForModal.locationSnapshot ? (
                <div className="text-xs space-y-1 text-[#7A6E65]">
                  <p className="font-bold text-[#3B302B]">{selectedOrderForModal.locationSnapshot.villageName}</p>
                  <p>{selectedOrderForModal.locationSnapshot.district} - {selectedOrderForModal.locationSnapshot.pincode}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No specific street address provided.</p>
              )}
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#3B302B] uppercase tracking-wide">Ordered Bakery Items</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(selectedOrderForModal.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#3B302B]">{item.productName || item.name}</p>
                      {item.customization?.message ? (
                        <p className="text-[10px] text-[#596B58] font-semibold">
                          Plaque Inscription: "{item.customization.message}"
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#3B302B]">x{item.quantity}</span>
                      <p className="font-extrabold text-[#596B58]">₹{item.subtotal || item.itemTotal || (item.unitPrice * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Status Update inside Modal */}
            <div className="pt-3 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#3B302B]">Update Stage:</span>
                <CustomSelect
                  value={selectedOrderForModal.orderStatus}
                  onChange={(newVal) => handleStatusChange(selectedOrderForModal.id || selectedOrderForModal.orderNumber, newVal)}
                  options={statusOptions}
                  className="h-9 text-xs min-w-[160px]"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrderForModal(null)}
              >
                Close Modal
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};
