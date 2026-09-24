import React from "react";
import { Outlet } from "react-router-dom";

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-[#FFF8EC] text-[#3B302B]">
      <aside className="w-64 border-r border-[#E5DEC9] bg-[#FFFFFF] p-6 hidden md:block">
        <h2 className="text-lg font-bold text-[#596B58] mb-6">Onebite Bakery Admin</h2>
        <nav className="space-y-3 font-medium text-sm">
          <a href="/admin" className="block px-3 py-2 rounded-md hover:bg-[#FFF8EC] hover:text-[#596B58]">Dashboard</a>
          <a href="/admin/products" className="block px-3 py-2 rounded-md hover:bg-[#FFF8EC] hover:text-[#596B58]">Products</a>
          <a href="/admin/orders" className="block px-3 py-2 rounded-md hover:bg-[#FFF8EC] hover:text-[#596B58]">Orders</a>
          <a href="/admin/customers" className="block px-3 py-2 rounded-md hover:bg-[#FFF8EC] hover:text-[#596B58]">Customers</a>
          <a href="/admin/platform" className="block px-3 py-2 rounded-md hover:bg-[#FFF8EC] hover:text-[#596B58]">Platform Operations</a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};
