import React from "react";
import { BarChart3, Box, Package, ShoppingBag, Users } from "lucide-react";

import {
  AdminCard,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
} from "../components/AdminComponents";

export const AdminDashboardShell: React.FC = () => {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Platform Administration Dashboard"
        description="Overview of bakery catalog items, real-time customer orders, and revenue stats."
      />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Total Products"
          value="48"
          change="4 new"
          isPositive={true}
          icon={<Package className="h-5 w-5" />}
        />
        <AdminStatCard
          title="Total Orders"
          value="1,240"
          change="12% vs last month"
          isPositive={true}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <AdminStatCard
          title="Monthly Revenue"
          value="₹4,82,500"
          change="18% increase"
          isPositive={true}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <AdminStatCard
          title="Active Customers"
          value="850"
          change="24 today"
          isPositive={true}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Recent Orders & Quick Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#2C1E16]">Recent Orders Placeholder</h3>
          <AdminTable headers={["Order #", "Customer", "Fulfillment", "Total", "Status"]}>
            <tr>
              <td className="px-4 py-3 font-mono font-bold">#ORD-9021</td>
              <td className="px-4 py-3">Ananya Sharma</td>
              <td className="px-4 py-3">Home Delivery</td>
              <td className="px-4 py-3 font-bold">₹1,298</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                  DELIVERED
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono font-bold">#ORD-9022</td>
              <td className="px-4 py-3">Rahul Verma</td>
              <td className="px-4 py-3">Store Pickup</td>
              <td className="px-4 py-3 font-bold">₹649</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  PREPARING
                </span>
              </td>
            </tr>
          </AdminTable>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#2C1E16]">System Quick Feed</h3>
          <AdminCard className="space-y-3">
            <div className="text-xs space-y-2 text-[#6E5D4F]">
              <p className="border-b border-[#E8E2D9] pb-2">
                &bull; <strong className="text-[#2C1E16]">Media Upload:</strong> 5 new cake images added.
              </p>
              <p className="border-b border-[#E8E2D9] pb-2">
                &bull; <strong className="text-[#2C1E16]">Search Index:</strong> Catalog re-indexed successfully.
              </p>
              <p>
                &bull; <strong className="text-[#2C1E16]">Audit Log:</strong> Admin session authenticated.
              </p>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
};
