import React from "react";
import { Outlet } from "react-router-dom";

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-[#F9F6F0] text-[#2C1E16]">
      <aside className="w-64 border-r border-[#E8E2D9] bg-[#FFFFFF] p-6 hidden md:block">
        <h2 className="text-lg font-bold text-[#E67E22] mb-6">OneBite Admin</h2>
        <nav className="space-y-3 font-medium text-sm">
          <a href="/admin" className="block px-3 py-2 rounded-md hover:bg-[#FFFBF5] hover:text-[#E67E22]">Dashboard</a>
          <a href="/admin/products" className="block px-3 py-2 rounded-md hover:bg-[#FFFBF5] hover:text-[#E67E22]">Products</a>
          <a href="/admin/orders" className="block px-3 py-2 rounded-md hover:bg-[#FFFBF5] hover:text-[#E67E22]">Orders</a>
          <a href="/admin/customers" className="block px-3 py-2 rounded-md hover:bg-[#FFFBF5] hover:text-[#E67E22]">Customers</a>
          <a href="/admin/platform" className="block px-3 py-2 rounded-md hover:bg-[#FFFBF5] hover:text-[#E67E22]">Platform Operations</a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};
