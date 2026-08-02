import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Box,
  FileSpreadsheet,
  FileText,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/auth.context";

const navSections = [
  { id: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { id: "catalog", label: "Catalog & Products", path: "/admin/catalog", icon: Package },
  { id: "categories", label: "Categories", path: "/admin/categories", icon: Box },
  { id: "occasions", label: "Occasions", path: "/admin/occasions", icon: Sparkles },
  { id: "orders", label: "Order Management", path: "/admin/orders", icon: ShoppingBag },
  { id: "customers", label: "Customer Accounts", path: "/admin/customers", icon: Users },
  { id: "payments", label: "Payments & Financials", path: "/admin/payments", icon: Box },
  { id: "notifications", label: "Notification Center", path: "/admin/notifications", icon: Bell },
  { id: "media", label: "Media Library", path: "/admin/media", icon: ImageIcon },
  { id: "analytics", label: "Platform Analytics", path: "/admin/analytics", icon: BarChart3 },
  { id: "reports", label: "Reports Console", path: "/admin/reports", icon: FileSpreadsheet },
  { id: "security", label: "Security & Audit", path: "/admin/security", icon: ShieldCheck },
  { id: "settings", label: "System Settings", path: "/admin/settings", icon: Settings },
  { id: "logs", label: "Activity Logs", path: "/admin/logs", icon: FileText },
];

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#2C1E16] text-[#FFFBF5] p-5 sm:p-6 flex flex-col justify-between transition-transform duration-300 shadow-2xl lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Header Logo */}
          <div className="flex items-center justify-between">
            <Link to="/" title="Go to Home Page Storefront" className="flex items-center gap-2 group">
              <span className="text-xl font-extrabold text-[#E67E22] tracking-tight group-hover:text-amber-400 transition-colors">OneBite</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white uppercase">
                Admin
              </span>
            </Link>
            {onClose ? (
              <button onClick={onClose} className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 text-xs">
            {navSections.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors ${
                    isActive
                      ? "bg-[#E67E22] text-white font-bold shadow-sm"
                      : "text-[#E8E2D9]/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 space-y-2.5 shrink-0">
          <Link
            to="/"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E67E22] hover:bg-[#D35400] text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Go to Home Page</span>
          </Link>

          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-red-600/80 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Exit Admin</span>
          </button>

          <p className="text-[10px] text-center text-[#E8E2D9]/50">
            OneBite Platform Engine &bull; v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};
