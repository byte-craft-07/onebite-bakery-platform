import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, MapPin, Navigation, Phone, Play, ShieldAlert, ShoppingBag, Truck, X } from "lucide-react";

import { Badge, Skeleton } from "@/components/ui/DisplayComponents";
import { useAuth } from "@/contexts/auth.context";
import {
  deliveryAgentService,
  type DeliveryAgentDashboardStats,
  type DeliveryOrder,
} from "../services/deliveryAgent.service";

export const DeliveryAgentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DeliveryAgentDashboardStats | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardAndOrders = async () => {
    try {
      setIsLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        deliveryAgentService.getDashboardStats(),
        deliveryAgentService.getOrders(selectedStatus),
      ]);
      setStats(statsRes);
      setOrders(ordersRes);
    } catch (_err) {
      setErrorMsg("Failed to load delivery orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardAndOrders();
  }, [selectedStatus]);

  const handleStartDelivery = async (orderId: string) => {
    setActionId(orderId);
    setErrorMsg(null);
    try {
      await deliveryAgentService.startDelivery(orderId);
      await fetchDashboardAndOrders();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to start delivery.");
    } finally {
      setActionId(null);
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    setActionId(orderId);
    setErrorMsg(null);
    try {
      await deliveryAgentService.completeDelivery(orderId);
      await fetchDashboardAndOrders();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to mark delivery as completed.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-7 w-7 text-[#596B58]" />
            <h1 className="text-2xl font-extrabold text-[#3B302B]">Delivery Partner Dashboard</h1>
          </div>
          <p className="text-xs text-[#7A6E65] mt-1">
            Welcome back, <span className="font-bold text-[#3B302B]">{user?.name}</span>! Manage your assigned delivery routes and orders.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg ? (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Today's Summary Cards */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5DEC9] p-4 rounded-2xl shadow-xs">
            <div className="text-[11px] font-bold text-[#7A6E65]">Assigned Today</div>
            <div className="text-2xl font-black text-[#3B302B] mt-1">{stats.todayAssigned}</div>
          </div>
          <div className="bg-white border border-amber-200 bg-amber-50/50 p-4 rounded-2xl shadow-xs">
            <div className="text-[11px] font-bold text-amber-800">Out for Delivery</div>
            <div className="text-2xl font-black text-amber-900 mt-1">{stats.todayOutForDelivery}</div>
          </div>
          <div className="bg-white border border-emerald-200 bg-emerald-50/50 p-4 rounded-2xl shadow-xs">
            <div className="text-[11px] font-bold text-emerald-800">Delivered Today</div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{stats.todayDelivered}</div>
          </div>
          <div className="bg-white border border-red-200 bg-red-50/50 p-4 rounded-2xl shadow-xs">
            <div className="text-[11px] font-bold text-red-800">Cancelled</div>
            <div className="text-2xl font-black text-red-900 mt-1">{stats.todayCancelled}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {/* Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedStatus === status
                ? "bg-[#596B58] text-white shadow-xs"
                : "bg-white border border-[#E5DEC9] text-[#3B302B] hover:border-[#596B58]"
            }`}
          >
            {status.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Delivery Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#E5DEC9] rounded-2xl p-12 text-center space-y-3">
          <Clock className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-[#3B302B]">No Deliveries Assigned</h3>
          <p className="text-xs text-[#7A6E65]">You currently have no assigned delivery orders for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-[#E5DEC9] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#596B58]/50 transition-colors"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5DEC9]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#3B302B] text-base">#{order.orderNumber}</span>
                    <Badge
                      variant={
                        order.orderStatus === "DELIVERED"
                          ? "success"
                          : order.orderStatus === "OUT_FOR_DELIVERY"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {order.orderStatus.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-[#7A6E65] mt-0.5">
                    {new Date(order.createdAt).toLocaleString()} &bull;{" "}
                    <span className="font-bold text-[#3B302B]">{order.deliveryMethod}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-[#3B302B]">
                      ₹{order.pricingSnapshot?.grandTotal ?? order.totalAmount ?? 0}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">{order.paymentStatus}</span>
                  </div>

                  {/* Action Buttons */}
                  {order.orderStatus === "PREPARING" || order.orderStatus === "CONFIRMED" ? (
                    <button
                      disabled={actionId === order.id || order.orderStatus !== "PREPARING"}
                      onClick={() => handleStartDelivery(order.id)}
                      className="px-4 py-2 bg-[#596B58] text-white text-xs font-bold rounded-xl hover:bg-[#495948] disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Start Delivery</span>
                    </button>
                  ) : order.orderStatus === "OUT_FOR_DELIVERY" ? (
                    <button
                      disabled={actionId === order.id}
                      onClick={() => handleCompleteDelivery(order.id)}
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  ) : order.orderStatus === "DELIVERED" ? (
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Delivery Address & Customer Snapshot */}
              {order.addressSnapshot || order.locationSnapshot ? (
                <div className="p-3.5 bg-[#FFF8EC] border border-[#E5DEC9] rounded-xl text-xs space-y-1.5 text-[#3B302B]">
                  <div className="font-bold flex items-center gap-1.5 text-[#3B302B]">
                    <MapPin className="h-4 w-4 text-[#596B58] shrink-0" />
                    <span>
                      {order.addressSnapshot?.fullName || "Customer"} &bull;{" "}
                      <a
                        href={`tel:${order.addressSnapshot?.phone}`}
                        className="text-[#596B58] hover:underline font-extrabold inline-flex items-center gap-0.5"
                      >
                        <Phone className="h-3 w-3 inline" /> {order.addressSnapshot?.phone}
                      </a>
                    </span>
                  </div>
                  <div className="text-[#7A6E65] pl-5">
                    {order.addressSnapshot?.street}, {order.addressSnapshot?.city},{" "}
                    {order.locationSnapshot ? (
                      <span className="font-semibold text-[#3B302B]">
                        {order.locationSnapshot.villageName} ({order.locationSnapshot.district} - {order.locationSnapshot.pincode})
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Order Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-[#3B302B]">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div className="font-semibold truncate pr-2">{item.productName}</div>
                    <div className="font-bold text-[#596B58] shrink-0">x{item.quantity} (₹{item.subtotal})</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
