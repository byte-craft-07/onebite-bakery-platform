import React from "react";
import { Outlet } from "react-router-dom";

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5] text-[#2C1E16]">
      <header className="sticky top-0 z-50 border-b border-[#E8E2D9] bg-[#FFFBF5]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-[#E67E22]">OneBite Bakery</div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <a href="/" className="hover:text-[#E67E22] transition-colors">Home</a>
          <a href="/products" className="hover:text-[#E67E22] transition-colors">Products</a>
          <a href="/categories" className="hover:text-[#E67E22] transition-colors">Categories</a>
          <a href="/contact" className="hover:text-[#E67E22] transition-colors">Contact</a>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet />
      </main>

      <footer className="border-t border-[#E8E2D9] bg-[#F9F6F0] py-8 text-center text-sm text-[#6E5D4F]">
        <p>&copy; {new Date().getFullYear()} OneBite Bakery Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};
