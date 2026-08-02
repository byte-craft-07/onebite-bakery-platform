import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Home, Menu, Search } from "lucide-react";

import { useAuth } from "@/contexts/auth.context";
import { adminOperationsService } from "../services/adminOperations.service";

export const Topbar: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    const list = await adminOperationsService.getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E8E2D9] bg-[#FFFBF5]/90 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="lg:hidden p-2 text-[#2C1E16]" aria-label="Open Navigation Menu">
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Admin Search */}
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
      <div className="flex items-center gap-3">
        {/* View Storefront / Home Page Button */}
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF3E6] border border-[#E67E22]/30 text-xs font-bold text-[#E67E22] hover:bg-[#E67E22] hover:text-white transition-all shadow-2xs"
          title="Return to Customer Storefront Home Page"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Storefront Home</span>
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-full text-[#2C1E16] hover:bg-[#F9F6F0] transition-colors relative cursor-pointer"
            aria-label="System Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[#E67E22] ring-2 ring-white animate-pulse" />
            ) : null}
          </button>

          {isNotifOpen ? (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E8E2D9] rounded-2xl shadow-xl p-4 space-y-3 text-xs animate-in fade-in z-50">
              <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
                <h4 className="font-bold text-[#2C1E16]">Notifications & Alerts</h4>
                {unreadCount > 0 ? (
                  <button onClick={handleMarkAllRead} className="text-[11px] text-[#E67E22] hover:underline flex items-center gap-1 font-semibold">
                    <Check className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                ) : null}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border text-xs space-y-1 ${notif.isRead ? "bg-white border-[#E8E2D9]" : "bg-[#FFFBF5] border-[#E67E22]/30 font-semibold"}`}>
                      <div className="flex items-center justify-between text-[#2C1E16]">
                        <span className="font-bold">{notif.title}</span>
                        <span className="text-[10px] text-gray-400">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-[#6E5D4F]">{notif.recipient}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">No new notifications</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* User Badge / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#F9F6F0] transition-colors cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-[#E67E22] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#2C1E16] leading-none">{user?.name || "Development Admin"}</p>
              <p className="text-[10px] text-[#6E5D4F] leading-tight mt-0.5">{user?.role || "admin"}</p>
            </div>
          </button>

          {isProfileOpen ? (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E8E2D9] rounded-2xl shadow-xl p-2 space-y-1 text-xs animate-in fade-in z-50">
              <div className="p-2 border-b border-[#E8E2D9] text-gray-500">
                Logged in as <strong>{user?.phone}</strong>
              </div>
              <Link
                to="/"
                className="block w-full text-left p-2 rounded-lg text-[#E67E22] hover:bg-[#FFF3E6] font-semibold"
              >
                Go to Home Page
              </Link>
              <button
                onClick={logout}
                className="w-full text-left p-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
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
