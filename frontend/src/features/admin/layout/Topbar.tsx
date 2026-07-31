import React, { useState } from "react";
import { Bell, Menu, Search, Shield, User } from "lucide-react";

import { useAuth } from "@/contexts/auth.context";

export const Topbar: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E8E2D9] bg-[#FFFBF5]/90 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="lg:hidden p-2 text-[#2C1E16]" aria-label="Open Navigation Menu">
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Admin Search Placeholder */}
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, SKU, customer phone..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs outline-none bg-white focus:border-[#E67E22]"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full text-[#2C1E16] hover:bg-[#F9F6F0] relative" aria-label="System Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#E67E22]" />
        </button>

        {/* User Badge / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#F9F6F0] transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-[#E67E22] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#2C1E16] leading-none">{user?.name || "Super Admin"}</p>
              <p className="text-[10px] text-[#6E5D4F] leading-tight mt-0.5">{user?.role || "ADMIN"}</p>
            </div>
          </button>

          {isProfileOpen ? (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E8E2D9] rounded-2xl shadow-xl p-2 space-y-1 text-xs animate-in fade-in">
              <div className="p-2 border-b border-[#E8E2D9] text-gray-500">
                Logged in as <strong>{user?.phone}</strong>
              </div>
              <button
                onClick={logout}
                className="w-full text-left p-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold"
              >
                Log Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
