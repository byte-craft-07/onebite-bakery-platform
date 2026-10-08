import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Box,
  Building2,
  Cake,
  FileSpreadsheet,
  FileText,
  Gift,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  PartyPopper,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth.context";

const centralAdminNavSections = [
  { id: "dashboard", labelKey: "admin.nav.dashboard", defaultLabel: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { id: "main-branch-orders", labelKey: "admin.nav.mainBranchOrders", defaultLabel: "Main Branch Orders", path: "/admin/main-branch-orders", icon: ShoppingBag },
  { id: "orders", labelKey: "admin.nav.globalOrders", defaultLabel: "Global Orders", path: "/admin/orders", icon: ShoppingBag },
  { id: "admins", labelKey: "admin.nav.admins", defaultLabel: "Admin Team & Access", path: "/admin/team", icon: UserCheck },
  { id: "banners", labelKey: "admin.nav.banners", defaultLabel: "Hero Posters & Banners", path: "/admin/banners", icon: ImageIcon },
  { id: "branches", labelKey: "admin.nav.branches", defaultLabel: "Branch Management", path: "/admin/branches", icon: Building2 },
  { id: "branch-matrix", labelKey: "admin.nav.branchMatrix", defaultLabel: "Branch Product Matrix", path: "/admin/branch-matrix", icon: Layers },
  { id: "catalog", labelKey: "admin.nav.catalog", defaultLabel: "Catalog & Products", path: "/admin/catalog", icon: Package },
  { id: "combos", labelKey: "admin.nav.combos", defaultLabel: "Celebration Combos", path: "/admin/combos", icon: Gift },
  { id: "decorations", labelKey: "admin.nav.decorations", defaultLabel: "Party Decorations", path: "/admin/decorations", icon: PartyPopper },
  { id: "custom-cakes", labelKey: "admin.nav.customCakes", defaultLabel: "Custom Cake Studio", path: "/admin/custom-cakes", icon: Cake },
  { id: "categories", labelKey: "admin.nav.categories", defaultLabel: "Categories", path: "/admin/categories", icon: Box },
  { id: "occasions", labelKey: "admin.nav.occasions", defaultLabel: "Occasions", path: "/admin/occasions", icon: Sparkles },
  { id: "coupons", labelKey: "admin.nav.coupons", defaultLabel: "Promo & Coupons", path: "/admin/coupons", icon: Tag },
  { id: "villages", labelKey: "admin.nav.villages", defaultLabel: "Villages Management", path: "/admin/villages", icon: MapPin },
  { id: "customers", labelKey: "admin.nav.customers", defaultLabel: "Customer Accounts", path: "/admin/customers", icon: Users },
  { id: "reviews", labelKey: "admin.nav.reviews", defaultLabel: "Customer Reviews", path: "/admin/reviews", icon: Star },
  { id: "payments", labelKey: "admin.nav.payments", defaultLabel: "Payments & Financials", path: "/admin/payments", icon: Box },
  { id: "notifications", labelKey: "admin.nav.notifications", defaultLabel: "Notification Center", path: "/admin/notifications", icon: Bell },
  { id: "media", labelKey: "admin.nav.media", defaultLabel: "Media Library", path: "/admin/media", icon: ImageIcon },
  { id: "analytics", labelKey: "admin.nav.analytics", defaultLabel: "Platform Analytics", path: "/admin/analytics", icon: BarChart3 },
  { id: "reports", labelKey: "admin.nav.reports", defaultLabel: "Reports Console", path: "/admin/reports", icon: FileSpreadsheet },
  { id: "security", labelKey: "admin.nav.security", defaultLabel: "Security & Audit", path: "/admin/security", icon: ShieldCheck },
  { id: "settings", labelKey: "admin.nav.settings", defaultLabel: "System Settings", path: "/admin/settings", icon: Settings },
  { id: "logs", labelKey: "admin.nav.logs", defaultLabel: "Activity Logs", path: "/admin/logs", icon: FileText },
];

const branchAdminNavSections = [
  { id: "branch-dash", labelKey: "admin.nav.branchDashboard", defaultLabel: "My Branch Dashboard", path: "/admin/branch/dashboard", icon: LayoutDashboard },
  { id: "branch-products", labelKey: "admin.nav.branchProducts", defaultLabel: "My Branch Inventory", path: "/admin/branch/products", icon: Package },
  { id: "branch-orders", labelKey: "admin.nav.branchOrders", defaultLabel: "My Branch Orders", path: "/admin/branch/orders", icon: ShoppingBag },
];

const deliveryAgentNavSections = [
  { id: "agent-dash", labelKey: "admin.nav.deliveryDashboard", defaultLabel: "Delivery Dashboard", path: "/agent/dashboard", icon: LayoutDashboard },
  { id: "agent-orders", labelKey: "admin.nav.myDeliveries", defaultLabel: "My Deliveries", path: "/agent/dashboard", icon: ShoppingBag },
];

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen = false, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  const navSections =
    user?.role === "delivery_agent"
      ? deliveryAgentNavSections
      : user?.role === "branch_admin"
      ? branchAdminNavSections
      : centralAdminNavSections;

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
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#3B302B] text-[#FFF8EC] p-5 sm:p-6 flex flex-col justify-between transition-transform duration-300 shadow-2xl lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Header Logo */}
          <div className="flex items-center justify-between">
            <Link to="/" title="Go to Home Page Storefront" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 shrink-0 flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="Onebite Bakery"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-extrabold text-[#596B58] tracking-tight group-hover:text-amber-400 transition-colors">Onebite Bakery</span>
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
                      ? "bg-[#596B58] text-white font-bold shadow-sm"
                      : "text-[#E5DEC9]/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(item.labelKey, item.defaultLabel)}</span>
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#596B58] hover:bg-[#495948] text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>{t("admin.nav.goToHomePage", "Go to Home Page")}</span>
          </Link>

          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-red-600/80 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("admin.nav.exitAdmin", "Exit Admin")}</span>
          </button>

          <p className="text-[10px] text-center text-[#E5DEC9]/50">
            Onebite Bakery Platform Engine &bull; v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};
