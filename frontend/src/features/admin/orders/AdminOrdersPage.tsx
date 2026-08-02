import React, { useEffect, useState } from "react";

import { Badge } from "@/components/ui/DisplayComponents";
import { CustomSelect } from "@/components/ui/FormControls";
import {
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from "../components/AdminComponents";
import { adminOperationsService, type AdminOrderSummary } from "../services/adminOperations.service";

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

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
    try {
      await adminOperationsService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (_err) {
      // Ignore
    }
  };

  const statusOptions = [
    { label: "PENDING", value: "PENDING" },
    { label: "CONFIRMED", value: "CONFIRMED" },
    { label: "PREPARING", value: "PREPARING" },
    { label: "OUT FOR DELIVERY", value: "OUT_FOR_DELIVERY" },
    { label: "DELIVERED", value: "DELIVERED" },
    { label: "CANCELLED", value: "CANCELLED" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Order Management & Dispatch Console"
        description="Monitor real-time customer orders, update baking stages, and manage delivery dispatches."
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E2D9] pb-4">
        {["ALL", "PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedStatus === st
                ? "bg-[#E67E22] text-white shadow-xs"
                : "bg-white border border-[#E8E2D9] text-[#2C1E16] hover:bg-[#F9F6F0]"
            }`}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <AdminToolbar
        searchPlaceholder="Search order number or customer phone..."
        onSearchChange={setSearchQuery}
      />

      <AdminTable headers={["Order #", "Customer", "Fulfillment", "Total", "Payment", "Order Stage", "Quick Dispatch Action"]}>
        {orders.map((ord) => (
          <tr key={ord.id} className="hover:bg-[#F9F6F0]/50 transition-colors">
            <td className="px-4 py-3 font-mono font-bold text-[#2C1E16]">#{ord.orderNumber}</td>
            <td className="px-4 py-3">
              <p className="font-bold">{ord.customerName}</p>
              <p className="text-[11px] text-gray-400">{ord.customerPhone}</p>
            </td>
            <td className="px-4 py-3 font-medium text-xs">{ord.fulfillmentType}</td>
            <td className="px-4 py-3 font-extrabold text-[#2C1E16]">₹{ord.totalAmount}</td>
            <td className="px-4 py-3">
              <Badge variant={ord.paymentStatus === "PAID" ? "success" : "warning"}>
                {ord.paymentStatus}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <Badge variant={ord.orderStatus === "DELIVERED" ? "success" : "primary"}>
                {ord.orderStatus}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <CustomSelect
                value={ord.orderStatus}
                onChange={(newVal) => handleStatusChange(ord.id, newVal)}
                options={statusOptions}
                className="h-8 text-[11px] min-w-[150px]"
              />
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
};
