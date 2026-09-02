import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Building,
  Cake,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  HelpCircle,
  LifeBuoy,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  User,
  Zap,
} from "lucide-react";

import { Badge, Card, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/contexts/auth.context";
import { addressService } from "@/services/address.service";
import {
  customerDashboardService,
  type CustomerAnalyticsSummary,
} from "@/services/customerDashboard.service";
import { orderService, type OrderDetails } from "@/services/order.service";
import { FlipkartOrderTracker } from "@/components/shopping/FlipkartOrderTracker";

export const CustomerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<CustomerAnalyticsSummary | null>(null);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [addressCount, setAddressCount] = useState<number>(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [celebrationsCount, setCelebrationsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedRedirect = sessionStorage.getItem("theonlinebakery_auth_redirect");
    if (savedRedirect && savedRedirect !== "/customer/dashboard") {
      sessionStorage.removeItem("theonlinebakery_auth_redirect");
      navigate(savedRedirect, { replace: true });
    }
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summary, ords, addrs] = await Promise.all([
        customerDashboardService.getAnalyticsSummary().catch(() => null),
        orderService.getCustomerOrders().catch(() => []),
        addressService.getAddresses().catch(() => []),
      ]);
      setAnalytics(summary);
      setOrders(ords);
      setAddressCount(addrs.length);

      const celList = customerDashboardService.getCelebrations();
      setCelebrationsCount(celList.length);

      const notifs = customerDashboardService.getCustomerNotifications();
      setUnreadNotifsCount(notifs.filter((n) => !n.isRead).length);
    } catch (_err) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 22) return "Good Evening";
    return "Good Night";
  };

  // Find active live running orders
  const runningOrders = orders.filter(
    (o) =>
      o.orderStatus !== "DELIVERED" &&
      o.orderStatus !== "CANCELLED" &&
      o.orderStatus !== "REFUNDED",
  );

  const primaryLiveOrder = runningOrders.length > 0 ? runningOrders[0] : null;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const navMenuItems = [
    {
      title: "My Orders & Tracking",
      description: "Live order status, invoice download, rate past items",
      badge: runningOrders.length > 0 ? `${runningOrders.length} Active` : undefined,
      badgeVariant: "primary" as const,
      icon: Package,
      color: "text-[#596B58] bg-[#FFF8EC]",
      to: "/customer/orders",
    },
    {
      title: "Saved Delivery Addresses",
      description: `${addressCount} saved location${addressCount === 1 ? "" : "s"} & village routes`,
      icon: MapPin,
      color: "text-blue-600 bg-blue-50",
      to: "/customer/addresses",
    },
    {
      title: "Celebration Reminders",
      description: `${celebrationsCount} upcoming birthday${celebrationsCount === 1 ? "" : "s"} & anniversaries`,
      icon: Cake,
      color: "text-pink-600 bg-pink-50",
      to: "/customer/celebrations",
    },
    {
      title: "Notifications & Alerts",
      description: "Order status alerts & account updates",
      badge: unreadNotifsCount > 0 ? `${unreadNotifsCount} New` : undefined,
      badgeVariant: "warning" as const,
      icon: Bell,
      color: "text-amber-600 bg-amber-50",
      to: "/customer/notifications",
    },
    {
      title: "My Favorites / Wishlist",
      description: "Your saved cakes, pastries, and treats",
      icon: Heart,
      color: "text-red-600 bg-red-50",
      to: "/customer/favorites",
    },
    {
      title: "Bakery Offers & Coupons",
      description: "Exclusive discount codes & festival deals",
      badge: "Save Big",
      badgeVariant: "success" as const,
      icon: Ticket,
      color: "text-emerald-600 bg-emerald-50",
      to: "/offers",
    },
    {
      title: "Customer Help & Support",
      description: "24/7 WhatsApp care & support ticket helpdesk",
      icon: LifeBuoy,
      color: "text-teal-600 bg-teal-50",
      to: "/customer/support",
    },
    {
      title: "Personal Profile",
      description: "Name, email, avatar photo & verified phone",
      icon: User,
      color: "text-purple-600 bg-purple-50",
      to: "/customer/profile",
    },
    {
      title: "Notification Preferences",
      description: "Transactional SMS, WhatsApp updates & promo alerts",
      icon: Bell,
      color: "text-orange-600 bg-orange-50",
      to: "/customer/settings",
    },
    {
      title: "Security & Connected Devices",
      description: "Active device logins, sessions & encryption logs",
      icon: ShieldCheck,
      color: "text-green-700 bg-green-50",
      to: "/customer/security",
    },
  ];

  const adminMenuItems = user?.role === "admin" ? [
    {
      title: "Central Admin Dashboard",
      description: "Manage live orders, catalog products, branches, offers & bakery settings",
      badge: "👑 Admin Access",
      badgeVariant: "warning" as const,
      icon: ShieldCheck,
      color: "text-amber-700 bg-amber-100",
      to: "/admin/dashboard",
    },
  ] : user?.role === "branch_admin" ? [
    {
      title: "Branch Admin Portal",
      description: "Manage branch inventory, incoming orders & live dispatch status",
      badge: "🏪 Branch Admin",
      badgeVariant: "primary" as const,
      icon: Building,
      color: "text-blue-700 bg-blue-100",
      to: "/admin/branch/dashboard",
    },
  ] : [];

  const allNavMenuItems = [...adminMenuItems, ...navMenuItems];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Profile Header Card */}
      <section className="relative rounded-3xl bg-gradient-to-r from-[#3B302B] via-[#3D2B20] to-[#3B302B] text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Cake className="h-64 w-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <UserAvatar
              user={user}
              size="xl"
              className="border-2 border-white shadow-lg ring-2 ring-white/20 shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  user?.role === "admin" ? "bg-amber-500/30 text-amber-300 border border-amber-400/40 font-black" : "bg-white/10 text-amber-300"
                }`}>
                  {user?.role === "admin" ? "👑 Admin Account" : user?.role === "branch_admin" ? "🏪 Branch Admin" : "Customer Hub"}
                </span>
                <span className="text-[10px] font-semibold text-[#E5DEC9]/80">
                  Member Since {analytics?.memberSince || "2026"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {getGreeting()}, {user?.name || (user?.email ? user.email.split("@")[0] : "Customer")} ❤️
              </h1>
              <p className="text-xs text-[#E5DEC9]/80">
                {user?.phone ? `+91 ${user.phone}` : user?.email || "The Online Bakery"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user?.role === "admin" ? (
              <Link to="/admin/dashboard">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold border-none text-xs shadow-md flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Button>
              </Link>
            ) : user?.role === "branch_admin" ? (
              <Link to="/admin/branch/dashboard">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold border-none text-xs shadow-md flex items-center gap-1.5">
                  <Building className="h-4 w-4" />
                  <span>Branch Portal</span>
                </Button>
              </Link>
            ) : null}

            <Link to="/products">
              <Button size="sm" className="bg-[#596B58] hover:bg-[#495948] text-white border-none shadow-md text-xs">
                <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                <span>Shop Fresh</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Quick Key Stats Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Orders", val: orders.length, icon: Package, color: "text-[#596B58]", to: "/customer/orders" },
          { label: "Live Orders", val: runningOrders.length, icon: Clock, color: "text-amber-500", to: "/customer/orders" },
          { label: "Addresses", val: addressCount, icon: MapPin, color: "text-blue-600", to: "/customer/addresses" },
          { label: "Celebrations", val: celebrationsCount, icon: Cake, color: "text-pink-600", to: "/customer/celebrations" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link key={idx} to={stat.to} className="block group">
              <Card className="p-4 space-y-1 border-[#E5DEC9] bg-white group-hover:border-[#596B58]/50 group-hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#7A6E65] uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#3B302B]">{stat.val}</p>
              </Card>
            </Link>
          );
        })}
      </section>

      {/* 3. Live In-Progress Order Notification (If active) */}
      {primaryLiveOrder ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#596B58] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#596B58]" />
              </span>
              <h2 className="text-lg font-extrabold text-[#3B302B]">Live Order in Progress</h2>
            </div>
            <Link to={`/customer/orders/${primaryLiveOrder.id}`} className="text-xs font-bold text-[#596B58] hover:underline">
              Full Order Details →
            </Link>
          </div>

          <Card className="p-5 sm:p-6 space-y-4 border-[#596B58]/50 bg-[#FFF8EC] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5DEC9] pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-[#3B302B]">
                    Order #{primaryLiveOrder.orderNumber}
                  </span>
                  <Badge variant="primary">{primaryLiveOrder.orderStatus}</Badge>
                </div>
                <p className="text-xs text-[#7A6E65] mt-0.5">
                  Slot: {primaryLiveOrder.deliveryTimePreference || "Standard Delivery"} &bull; Total: ₹{primaryLiveOrder.totalAmount}
                </p>
              </div>

              <Link to={`/customer/orders/${primaryLiveOrder.id}`}>
                <Button size="sm" className="w-full sm:w-auto">
                  Track Live Status
                </Button>
              </Link>
            </div>

            <FlipkartOrderTracker order={primaryLiveOrder} isRated={false} />
          </Card>
        </section>
      ) : null}

      {/* 4. Dedicated Pages Menu Grid (Separate Focused Pages) */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[#3B302B]">Account Services & Features</h2>
          <p className="text-xs text-[#7A6E65]">
            Dedicated separate pages for every service &mdash; tap to manage
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allNavMenuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link key={idx} to={item.to} className="block group">
                <Card className="p-4 sm:p-5 border-[#E5DEC9] bg-white group-hover:border-[#596B58] group-hover:shadow-md transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-2xl ${item.color} shrink-0 transition-transform group-hover:scale-105`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-[#3B302B] group-hover:text-[#596B58] transition-colors">
                          {item.title}
                        </h3>
                        {item.badge ? (
                          <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-[#7A6E65] line-clamp-1">{item.description}</p>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#596B58] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Quick Support & Helpline Strip */}
      <div className="p-5 rounded-2xl bg-[#FFF8EC] border border-[#596B58]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-600 text-white shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#3B302B]">Need quick help with an order?</h4>
            <p className="text-xs text-[#7A6E65]">Our WhatsApp bakery team is available 24/7 to assist you.</p>
          </div>
        </div>

        <button
          onClick={() => {
            const text = encodeURIComponent("Hi The Online Bakery! I need assistance with my account / order.");
            window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
          }}
          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Chat on WhatsApp</span>
        </button>
      </div>

      {/* 6. Logout Action */}
      <div className="pt-2 text-center">
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out of The Online Bakery Account</span>
        </button>
      </div>
    </div>
  );
};
