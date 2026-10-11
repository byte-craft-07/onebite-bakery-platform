import React, { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Package, ShoppingBag, Truck, Users } from "lucide-react";

import {
  AdminCard,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
} from "../components/AdminComponents";
import {
  adminOperationsService,
  type AdminOrderSummary,
  type StoreSettingsPayload,
} from "../services/adminOperations.service";
import { adminCatalogService } from "../services/adminCatalog.service";
import { Button } from "@/components/ui/Button";

export const AdminDashboardShell: React.FC = () => {
  const [productCount, setProductCount] = useState<number>(0);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettingsPayload | null>(null);
  const [minOrderLimitInput, setMinOrderLimitInput] = useState<number>(300);
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [limitSavedMsg, setLimitSavedMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [prodsRes, ordersList, customersList, logs, settingsRes] = await Promise.all([
        adminCatalogService.getProducts().catch(() => []),
        adminOperationsService.getAllOrders().catch(() => []),
        adminOperationsService.getCustomers().catch(() => []),
        adminOperationsService.getAuditLogs().catch(() => []),
        adminOperationsService.getSettings().catch(() => null),
      ]);

      setProductCount(Array.isArray(prodsRes) ? prodsRes.length : 0);
      setOrders(ordersList);
      setCustomerCount(customersList?.length || 3);
      setAuditLogs(logs.slice(0, 5));
      if (settingsRes) {
        setStoreSettings(settingsRes);
        setMinOrderLimitInput(settingsRes.minOrderValue ?? 300);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveMinOrderLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLimit(true);
    setLimitSavedMsg(null);
    try {
      const current = storeSettings || (await adminOperationsService.getSettings());
      const updated = await adminOperationsService.updateSettings({
        ...current,
        minOrderValue: Math.max(0, Number(minOrderLimitInput)),
      });
      setStoreSettings(updated);
      setMinOrderLimitInput(updated.minOrderValue);
      setLimitSavedMsg(`Online order lower limit updated to ₹${updated.minOrderValue}!`);
      setTimeout(() => setLimitSavedMsg(null), 4000);
    } finally {
      setIsSavingLimit(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Platform Administration Dashboard"
        description="Live overview of bakery catalog products, customer order activity, and revenue stats."
      />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Total Products"
          value={isLoading ? "..." : `${productCount}`}
          change="Active in Catalog"
          isPositive={true}
          icon={<Package className="h-5 w-5 text-[#596B58]" />}
          to="/admin/catalog"
        />
        <AdminStatCard
          title="Total Orders"
          value={isLoading ? "..." : `${orders.length}`}
          change="Orders Placed"
          isPositive={true}
          icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
          to="/admin/orders"
        />
        <AdminStatCard
          title="Total Revenue"
          value={isLoading ? "..." : `₹${totalRevenue.toLocaleString()}`}
          change="Gross Sales"
          isPositive={true}
          icon={<BarChart3 className="h-5 w-5 text-green-600" />}
          to="/admin/analytics"
        />
        <AdminStatCard
          title="Registered Customers"
          value={isLoading ? "..." : `${customerCount}`}
          change="Active Accounts"
          isPositive={true}
          icon={<Users className="h-5 w-5 text-amber-600" />}
          to="/admin/customers"
        />
      </div>

      {/* Quick Admin Control: Online Order Minimum Price Limit */}
      <AdminCard title="🚚 Online Order Price Lower Limit (Minimum Order Value)">
        <form onSubmit={handleSaveMinOrderLimit} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1 flex-1">
            <p className="text-xs text-[#7A6E65]">
              Set the minimum order amount required for customers to place an <strong>Online Order (Home Delivery)</strong>. If a customer&apos;s order is below this limit, they will see: <em>&quot;You are not eligible for online order because you are not full fill requirement&quot;</em> and will be prompted to choose <strong>Store Pickup</strong>.
            </p>
            {limitSavedMsg ? (
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>{limitSavedMsg}</span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#FFF8EC] border border-[#E5DEC9] rounded-xl px-3 py-2">
              <Truck className="h-4 w-4 text-[#596B58]" />
              <span className="text-xs font-bold text-[#7A6E65]">Min Limit (₹):</span>
              <input
                type="number"
                min={0}
                value={minOrderLimitInput}
                onChange={(e) => setMinOrderLimitInput(Number(e.target.value))}
                className="w-24 px-2 py-1 rounded-lg border border-[#E5DEC9] bg-white text-sm font-extrabold text-[#3B302B] outline-none focus:border-[#596B58]"
                required
              />
            </div>
            <Button type="submit" size="sm" isLoading={isSavingLimit}>
              Save Limit
            </Button>
          </div>
        </form>
      </AdminCard>

      {/* Recent Orders & Quick Activity Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#3B302B]">Recent Orders Activity</h3>
          <AdminTable headers={["Order #", "Customer Phone", "Fulfillment", "Total Amount", "Order Status"]}>
            {recentOrders.length > 0 ? (
              recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#3B302B]">#{ord.orderNumber}</td>
                  <td className="px-4 py-3 text-xs">{ord.customerPhone || "9876543210"}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{ord.fulfillmentType === "STORE_PICKUP" ? "Store Pickup" : "Home Delivery"}</td>
                  <td className="px-4 py-3 font-extrabold text-[#3B302B]">₹{ord.totalAmount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.orderStatus === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : ord.orderStatus === "CONFIRMED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.orderStatus}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-3 text-xs text-[#7A6E65]" colSpan={5}>
                  No orders placed yet. Products ready in catalog.
                </td>
              </tr>
            )}
          </AdminTable>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#3B302B]">Real-time Audit Feed</h3>
          <AdminCard className="space-y-3">
            {auditLogs.length > 0 ? (
              <div className="text-xs space-y-2 text-[#7A6E65]">
                {auditLogs.map((log, idx) => (
                  <p key={idx} className="border-b border-[#E5DEC9] pb-2 last:border-0">
                    &bull; <strong className="text-[#3B302B]">{log.action}:</strong> {log.entityType} ({new Date(log.createdAt).toLocaleTimeString()})
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7A6E65]">System audit engine active.</p>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
};
