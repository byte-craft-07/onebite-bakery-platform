import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Cake,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  LifeBuoy,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";

import { Badge, Card, EmptyState, Modal, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { ProductCard } from "@/components/cards/ProductCard";
import { useAuth } from "@/contexts/auth.context";
import { addressService, type Address } from "@/services/address.service";
import { cartService } from "@/services/cart.service";
import { catalogService, type ProductItem } from "@/services/catalog.service";
import {
  customerDashboardService,
  type CelebrationItem,
  type CustomerAnalyticsSummary,
  type CustomerNotificationItem,
  type SupportTicket,
} from "@/services/customerDashboard.service";
import { favoritesService } from "@/services/favorites.service";
import { orderService, type OrderDetails } from "@/services/order.service";

export const CustomerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  // State
  const [analytics, setAnalytics] = useState<CustomerAnalyticsSummary | null>(null);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [favorites, setFavorites] = useState<ProductItem[]>([]);
  const [celebrations, setCelebrations] = useState<CelebrationItem[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [recommended, setRecommended] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Form states
  const [addressForm, setAddressForm] = useState({
    name: user?.name || "Customer Address",
    phone: user?.phone || "9876543210",
    street: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const [celebrationForm, setCelebrationForm] = useState({
    title: "",
    type: "Birthday" as CelebrationItem["type"],
    date: "",
    reminderEnabled: true,
  });

  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "Order Support",
    message: "",
  });

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Initial Fetch
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const summary = await customerDashboardService.getAnalyticsSummary();
      setAnalytics(summary);

      const customerOrders = await orderService.getCustomerOrders().catch(() => []);
      setOrders(customerOrders);

      const customerAddrs = await addressService.getAddresses().catch(() => []);
      setAddresses(customerAddrs);

      const favProds = await favoritesService.getFavorites().catch(() => []);
      setFavorites(favProds);

      const celList = customerDashboardService.getCelebrations();
      setCelebrations(celList);

      const notifList = customerDashboardService.getCustomerNotifications();
      setNotifications(notifList);

      const ticketList = customerDashboardService.getSupportTickets();
      setTickets(ticketList);

      const recRes = await catalogService.searchProducts({ limit: 4 }).catch(() => ({ products: [] }));
      setRecommended(recRes.products);
    } catch (_err) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filter running orders
  const runningOrders = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.orderStatus)
  );

  // Handlers
  const handleOrderAgain = async (ord: OrderDetails) => {
    setReorderingId(ord.id);
    try {
      for (const item of ord.items) {
        await cartService.addItem({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
      window.location.href = "/cart";
    } catch (_err) {
      window.location.href = "/cart";
    } finally {
      setReorderingId(null);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addressService.createAddress(addressForm);
      setStatusMsg("Address saved successfully!");
      setIsAddressModalOpen(false);
      setAddressForm({ name: user?.name || "Address", phone: user?.phone || "9876543210", street: "", city: "", state: "", pincode: "", isDefault: false });
      const updated = await addressService.getAddresses();
      setAddresses(updated);
    } catch (_err) {
      setStatusMsg("Address saved.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await addressService.deleteAddress(id);
    const updated = await addressService.getAddresses();
    setAddresses(updated);
  };

  const handleSaveCelebration = (e: React.FormEvent) => {
    e.preventDefault();
    customerDashboardService.addCelebration(celebrationForm);
    setCelebrations(customerDashboardService.getCelebrations());
    setIsCelebrationModalOpen(false);
    setCelebrationForm({ title: "", type: "Birthday", date: "", reminderEnabled: true });
    setStatusMsg("Celebration event added to calendar!");
  };

  const handleDeleteCelebration = (id: string) => {
    customerDashboardService.deleteCelebration(id);
    setCelebrations(customerDashboardService.getCelebrations());
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    customerDashboardService.createSupportTicket(ticketForm);
    setTickets(customerDashboardService.getSupportTickets());
    setIsTicketModalOpen(false);
    setTicketForm({ subject: "", category: "Order Support", message: "" });
    setStatusMsg("Support ticket created. Our team will contact you shortly.");
  };

  const handleMarkNotifRead = (id: string) => {
    customerDashboardService.markNotificationRead(id);
    setNotifications(customerDashboardService.getCustomerNotifications());
  };

  const handleDeleteNotif = (id: string) => {
    customerDashboardService.deleteNotification(id);
    setNotifications(customerDashboardService.getCustomerNotifications());
  };

  const handleRemoveFavorite = async (productId: string) => {
    await favoritesService.removeFavorite(productId);
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  // 8-stage timeline mapping
  const timelineStages = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Baking",
    "Quality Check",
    "Packed",
    "Out for Delivery",
    "Delivered",
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case "PENDING": return 0;
      case "CONFIRMED": return 1;
      case "PREPARING": return 2;
      case "BAKING": return 3;
      case "QUALITY_CHECK": return 4;
      case "PACKED": return 5;
      case "OUT_FOR_DELIVERY": return 6;
      case "DELIVERED": return 7;
      default: return 1;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-10">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* SECTION 1 — Welcome Banner */}
      <section className="relative rounded-3xl bg-gradient-to-r from-[#2C1E16] via-[#3D2B20] to-[#2C1E16] text-white p-8 md:p-10 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Cake className="h-72 w-72 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-[#E67E22] text-white font-extrabold text-2xl flex items-center justify-center border-2 border-white shadow-md">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 uppercase tracking-wider">
                Personal Control Center
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Good Morning, {user?.name || "Valued Customer"} ❤️
              </h1>
              <p className="text-xs text-[#E8E2D9]/80">
                Welcome back to OneBite Artisanal Bakery &bull; Member Since: {analytics?.memberSince || "January 2026"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/products">
              <Button size="sm" className="bg-[#E67E22] hover:bg-[#D35400] text-white border-none shadow-md">
                <ShoppingBag className="h-4 w-4 mr-1.5" />
                <span>Shop Fresh Catalog</span>
              </Button>
            </Link>

            {user?.role === "admin" ? (
              <Link to="/admin/dashboard">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <span>Go to Admin Panel</span>
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {statusMsg ? (
        <div className="p-4 bg-green-50 text-green-800 text-xs font-bold rounded-2xl border border-green-200 flex items-center justify-between animate-in fade-in">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-green-600 hover:text-green-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* SECTION 2 — Real Statistics Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Orders", val: analytics?.totalOrders || 0, link: "/customer/orders", icon: Package, color: "text-[#E67E22]" },
          { label: "Running Orders", val: analytics?.runningOrdersCount || 0, link: "#running-orders", icon: Clock, color: "text-amber-500" },
          { label: "Delivered", val: analytics?.deliveredOrdersCount || 0, link: "/customer/orders", icon: CheckCircle2, color: "text-green-600" },
          { label: "Cancelled", val: analytics?.cancelledOrdersCount || 0, link: "/customer/orders", icon: AlertCircle, color: "text-red-500" },
          { label: "Favorites", val: analytics?.favoritesCount || 0, link: "#favorites-section", icon: Heart, color: "text-rose-500" },
          { label: "Total Spent", val: `₹${(analytics?.totalSpent || 0).toLocaleString()}`, link: "#analytics-section", icon: TrendingUp, color: "text-blue-600" },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <a key={idx} href={card.link} className="block group">
              <Card className="p-4 space-y-2 group-hover:-translate-y-1 transition-transform border-[#E8E2D9] bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6E5D4F] uppercase tracking-wider">{card.label}</span>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className="text-xl font-extrabold text-[#2C1E16]">{card.val}</p>
              </Card>
            </a>
          );
        })}
      </section>

      {/* SECTION 3 & 4 — Active Running Orders & Live 8-Stage Order Timeline */}
      <section id="running-orders" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#2C1E16]">Running Active Orders ({runningOrders.length})</h2>
            <p className="text-xs text-[#6E5D4F]">Real-time 8-stage baking and delivery progress tracking</p>
          </div>
          <Link to="/customer/orders" className="text-xs font-bold text-[#E67E22] hover:underline">
            View All Order History
          </Link>
        </div>

        {runningOrders.length > 0 ? (
          <div className="space-y-6">
            {runningOrders.map((ord) => {
              const currentStageIdx = getStageIndex(ord.orderStatus);
              return (
                <Card key={ord.id} className="p-6 space-y-6 border-[#E67E22]/40 bg-[#FFFBF5]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E2D9] pb-4 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#2C1E16]">Order #{ord.orderNumber}</span>
                        <Badge variant="primary">{ord.orderStatus}</Badge>
                      </div>
                      <p className="text-xs text-[#6E5D4F] mt-0.5">
                        Placed on {new Date(ord.createdAt).toLocaleString()} &bull; Delivery Slot: Today 4:00 PM - 6:00 PM
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/customer/orders/${ord.id}`}>
                        <Button size="sm" variant="outline">
                          Track Order Details
                        </Button>
                      </Link>
                      <button
                        onClick={() => {
                          const text = encodeURIComponent(`Hi OneBite Bakery! Checking status for Order #${ord.orderNumber}`);
                          window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
                        }}
                        className="px-3 py-1.5 rounded-lg border border-green-600 text-green-700 font-bold text-xs hover:bg-green-50 flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                        <span>Contact Bakery</span>
                      </button>
                    </div>
                  </div>

                  {/* 8-Stage Progress Tracker Bar */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#2C1E16]">Live Bakery Progress Timeline</span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                      {timelineStages.map((stage, sIdx) => {
                        const isPassed = sIdx <= currentStageIdx;
                        const isCurrent = sIdx === currentStageIdx;
                        return (
                          <div key={sIdx} className="flex flex-col items-center text-center space-y-1">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all ${
                                isCurrent
                                  ? "bg-[#E67E22] text-white ring-4 ring-[#FFF3E6] scale-110"
                                  : isPassed
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-200 text-gray-400"
                              }`}
                            >
                              {sIdx + 1}
                            </div>
                            <span className={`text-[10px] leading-tight font-medium ${isPassed ? "text-[#2C1E16]" : "text-gray-400"}`}>
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between text-xs text-[#6E5D4F]">
                    <div>
                      <strong>Items:</strong> {ord.items.map((i) => `${i.name} (${i.quantity})`).join(", ")}
                    </div>
                    <span className="text-sm font-extrabold text-[#2C1E16]">Total: ₹{ord.totalAmount}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Active Running Orders"
            description="You don't have any active bakery delivery orders in progress right now."
            action={
              <Link to="/products">
                <Button size="sm">Order Fresh Cakes Now</Button>
              </Link>
            }
          />
        )}
      </section>

      {/* SECTION 5 — Recent Orders Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-[#2C1E16]">Recent Orders (Last 10)</h2>
          <Link to="/customer/orders" className="text-xs font-bold text-[#E67E22] hover:underline">
            View All Orders
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9] bg-white shadow-2xs max-w-full">
            <table className="w-full text-left text-xs text-[#2C1E16]">
              <thead className="bg-[#FFF3E6] border-b border-[#E8E2D9] text-[#6E5D4F] uppercase font-bold">
                <tr>
                  <th className="px-4 py-3.5">Order #</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Order Status</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {orders.slice(0, 10).map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F9F6F0]/50 transition-colors">
                    <td className="px-4 py-3 font-bold">#{ord.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-extrabold">₹{ord.totalAmount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ord.orderStatus === "DELIVERED" ? "success" : "primary"}>
                        {ord.orderStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ord.paymentStatus === "PAID" ? "success" : "warning"}>
                        {ord.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/customer/orders/${ord.id}`} className="text-[#E67E22] font-bold hover:underline">
                          View
                        </Link>
                        <button
                          onClick={() => handleOrderAgain(ord)}
                          disabled={reorderingId === ord.id}
                          className="text-gray-600 hover:text-[#2C1E16] font-bold cursor-pointer"
                        >
                          Reorder
                        </button>
                        <button onClick={() => window.print()} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No Recent Orders" description="Your previous order history will appear here." />
        )}
      </section>

      {/* SECTION 6 — Quick Action Navigation Grid */}
      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold text-[#2C1E16]">Quick Account Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: "Shop Now", link: "/products", icon: ShoppingBag, color: "bg-[#FFF3E6] text-[#E67E22]" },
            { label: "Track Orders", link: "/customer/orders", icon: Package, color: "bg-blue-50 text-blue-600" },
            { label: "Favorites", link: "#favorites-section", icon: Heart, color: "bg-rose-50 text-rose-600" },
            { label: "Profile", link: "#profile-section", icon: User, color: "bg-purple-50 text-purple-600" },
            { label: "Addresses", link: "#address-section", icon: MapPin, color: "bg-green-50 text-green-600" },
            { label: "Support", link: "#support-section", icon: LifeBuoy, color: "bg-amber-50 text-amber-600" },
            { label: "Notifications", link: "#notif-section", icon: Bell, color: "bg-indigo-50 text-indigo-600" },
          ].map((act, idx) => {
            const Icon = act.icon;
            return (
              <a key={idx} href={act.link} className="block group text-center">
                <Card className="p-4 space-y-2 flex flex-col items-center justify-center group-hover:-translate-y-1 transition-transform border-[#E8E2D9]">
                  <div className={`p-3 rounded-2xl ${act.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#2C1E16]">{act.label}</span>
                </Card>
              </a>
            );
          })}
        </div>
      </section>

      {/* SECTION 7 — Saved Addresses Management */}
      <section id="address-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#2C1E16]">Saved Delivery Addresses</h2>
            <p className="text-xs text-[#6E5D4F]">Manage home, office, and celebration delivery locations</p>
          </div>

          <Button size="sm" onClick={() => setIsAddressModalOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add New Address</span>
          </Button>
        </div>

        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addresses.map((addr) => (
              <Card key={addr.id} className="p-5 space-y-3 border-[#E8E2D9] relative flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2C1E16] flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#E67E22]" />
                      <span>{addr.street}</span>
                    </span>
                    {addr.isDefault ? <Badge variant="success">Default</Badge> : null}
                  </div>
                  <p className="text-xs text-[#6E5D4F]">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                  {!addr.isDefault ? (
                    <button
                      onClick={async () => {
                        await addressService.setDefaultAddress(addr.id);
                        setAddresses(await addressService.getAddresses());
                      }}
                      className="text-xs font-bold text-[#E67E22] hover:underline cursor-pointer"
                    >
                      Set as Default
                    </button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Saved Addresses"
            description="Save your delivery address for 1-click cake checkout."
            action={
              <Button size="sm" onClick={() => setIsAddressModalOpen(true)}>
                Add First Address
              </Button>
            }
          />
        )}
      </section>

      {/* SECTION 8 — Saved Favorites Grid */}
      <section id="favorites-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-[#2C1E16]">Your Favorite Products ({favorites.length})</h2>
          <Link to="/products" className="text-xs font-bold text-[#E67E22] hover:underline">
            Explore More Products
          </Link>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map((prod) => (
              <div key={prod.id} className="relative group">
                <ProductCard product={prod} />
                <button
                  onClick={() => handleRemoveFavorite(prod.id)}
                  className="absolute top-3 right-12 p-2 rounded-full bg-white/90 text-red-600 shadow-sm z-20 hover:scale-110 transition-transform cursor-pointer"
                  title="Remove from Favorites"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Favorite Products Saved"
            description="Tap the heart icon on any bakery item to save it here for quick re-ordering."
          />
        )}
      </section>

      {/* SECTION 9 — Recommended Products */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#2C1E16]">Recommended for You</h2>
          <p className="text-xs text-[#6E5D4F]">Curated selection based on your bakery order preferences</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommended.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* SECTION 10 — Celebration Calendar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#2C1E16]">Celebration Reminder Calendar</h2>
            <p className="text-xs text-[#6E5D4F]">Never miss a birthday, anniversary, or milestone cake order</p>
          </div>

          <Button size="sm" onClick={() => setIsCelebrationModalOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Celebration</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {celebrations.map((cel) => (
            <Card key={cel.id} className="p-5 space-y-3 border-[#E8E2D9] bg-[#FFFBF5]">
              <div className="flex items-center justify-between">
                <Badge variant="primary">{cel.type}</Badge>
                <button onClick={() => handleDeleteCelebration(cel.id)} className="text-gray-400 hover:text-red-600 cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-base font-bold text-[#2C1E16]">{cel.title}</h3>
              <div className="flex items-center justify-between text-xs text-[#6E5D4F]">
                <span className="flex items-center gap-1 font-mono font-bold">
                  <Calendar className="h-3.5 w-3.5 text-[#E67E22]" />
                  <span>{cel.date}</span>
                </span>
                <span className="text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                  Reminder Active
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 11 — Notifications Center */}
      <section id="notif-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-[#2C1E16]">Notifications & Updates</h2>
          <span className="text-xs text-[#6E5D4F]">Unread: {notifications.filter((n) => !n.isRead).length}</span>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`p-4 flex items-center justify-between gap-4 border-[#E8E2D9] ${
                  notif.isRead ? "bg-white" : "bg-[#FFFBF5] border-[#E67E22]/40 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#FFF3E6] text-[#E67E22]">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2C1E16]">{notif.title}</h4>
                    <p className="text-xs text-[#6E5D4F]">{notif.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!notif.isRead ? (
                    <button
                      onClick={() => handleMarkNotifRead(notif.id)}
                      className="text-[11px] text-[#E67E22] font-bold hover:underline cursor-pointer"
                    >
                      Mark Read
                    </button>
                  ) : null}
                  <button onClick={() => handleDeleteNotif(notif.id)} className="text-gray-400 hover:text-red-600 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No Notifications" description="You're all caught up with your notifications." />
        )}
      </section>

      {/* SECTION 13 & 14 & 16 — Profile, Security, & Analytics Section */}
      <div id="profile-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <Card className="p-6 space-y-4 border-[#E8E2D9]">
          <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3">
            <User className="h-5 w-5 text-[#E67E22]" />
            <h3 className="text-lg font-bold text-[#2C1E16]">Account Information</h3>
          </div>
          <div className="space-y-3 text-xs text-[#6E5D4F]">
            <div>
              <span className="font-bold text-[#2C1E16] block">Full Name</span>
              <span>{user?.name || "Bakery Customer"}</span>
            </div>
            <div>
              <span className="font-bold text-[#2C1E16] block">Phone Number</span>
              <span>+91 {user?.phone || "9876543210"}</span>
            </div>
            <div>
              <span className="font-bold text-[#2C1E16] block">Email Address</span>
              <span>{user?.email || "customer@onebite.local"}</span>
            </div>
            <div>
              <span className="font-bold text-[#2C1E16] block">Member Since</span>
              <span>{analytics?.memberSince || "January 2026"}</span>
            </div>
          </div>
          <Link to="/customer/settings" className="block pt-2">
            <Button size="sm" variant="outline" className="w-full">
              Edit Profile Settings
            </Button>
          </Link>
        </Card>

        {/* Real Customer Analytics */}
        <Card id="analytics-section" className="p-6 space-y-4 border-[#E8E2D9] bg-[#FFFBF5]">
          <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3">
            <TrendingUp className="h-5 w-5 text-[#E67E22]" />
            <h3 className="text-lg font-bold text-[#2C1E16]">Customer Analytics</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[#E8E2D9]">
              <span className="text-[#6E5D4F]">Total Money Spent</span>
              <strong className="text-[#2C1E16]">₹{(analytics?.totalSpent || 0).toLocaleString()}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E8E2D9]">
              <span className="text-[#6E5D4F]">Total Cakes Ordered</span>
              <strong className="text-[#2C1E16]">{analytics?.totalCakesOrdered || 0} Cakes</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E8E2D9]">
              <span className="text-[#6E5D4F]">Favorite Category</span>
              <strong className="text-[#E67E22]">{analytics?.favoriteCategory}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E8E2D9]">
              <span className="text-[#6E5D4F]">Average Order Value</span>
              <strong className="text-[#2C1E16]">₹{analytics?.averageOrderValue}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#6E5D4F]">Last Order Placed</span>
              <strong className="text-gray-500">
                {analytics?.lastOrderDate ? new Date(analytics.lastOrderDate).toLocaleDateString() : "N/A"}
              </strong>
            </div>
          </div>
        </Card>

        {/* Security & Support Actions */}
        <Card id="support-section" className="p-6 space-y-4 border-[#E8E2D9]">
          <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3">
            <LifeBuoy className="h-5 w-5 text-[#E67E22]" />
            <h3 className="text-lg font-bold text-[#2C1E16]">Support & Security</h3>
          </div>
          <div className="space-y-2.5">
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FFF3E6] text-[#E67E22] font-bold text-xs hover:bg-[#E67E22] hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Raise Support Ticket</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                const text = encodeURIComponent("Hi OneBite Bakery! I need support with my account.");
                window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-green-600 text-green-700 font-bold text-xs hover:bg-green-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span>WhatsApp Customer Support</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out of Account</span>
            </button>
          </div>
        </Card>
      </div>

      {/* MODALS */}
      {/* Add Address Modal */}
      <Modal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title="Add Delivery Address">
        <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
          <Input
            label="Street Address / House No."
            placeholder="Flat 302, Palm Heights"
            value={addressForm.street}
            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="Mumbai"
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              required
            />
            <Input
              label="State"
              placeholder="Maharashtra"
              value={addressForm.state}
              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              required
            />
          </div>
          <Input
            label="Pincode / ZIP Code"
            placeholder="400001"
            value={addressForm.pincode}
            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
            required
          />
          <Button type="submit" className="w-full">
            Save Address
          </Button>
        </form>
      </Modal>

      {/* Add Celebration Modal */}
      <Modal isOpen={isCelebrationModalOpen} onClose={() => setIsCelebrationModalOpen(false)} title="Add Celebration Reminder">
        <form onSubmit={handleSaveCelebration} className="space-y-4 pt-2">
          <Input
            label="Celebration Event Title"
            placeholder="Rohan's 30th Birthday"
            value={celebrationForm.title}
            onChange={(e) => setCelebrationForm({ ...celebrationForm, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-xs font-bold text-[#2C1E16] mb-1">Event Category</label>
            <select
              value={celebrationForm.type}
              onChange={(e) => setCelebrationForm({ ...celebrationForm, type: e.target.value as any })}
              className="w-full p-2.5 rounded-xl border border-[#E8E2D9] text-xs outline-none bg-white"
            >
              <option value="Birthday">Birthday</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Wedding">Wedding</option>
              <option value="Baby Shower">Baby Shower</option>
              <option value="Festival">Festival</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Input
            label="Event Date"
            type="date"
            value={celebrationForm.date}
            onChange={(e) => setCelebrationForm({ ...celebrationForm, date: e.target.value })}
            required
          />
          <Button type="submit" className="w-full">
            Save Celebration Event
          </Button>
        </form>
      </Modal>

      {/* Support Ticket Modal */}
      <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Raise Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
          <Input
            label="Ticket Subject"
            placeholder="Delivery Slot Change Request"
            value={ticketForm.subject}
            onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
            required
          />
          <div>
            <label className="block text-xs font-bold text-[#2C1E16] mb-1">Issue Category</label>
            <select
              value={ticketForm.category}
              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-[#E8E2D9] text-xs outline-none bg-white"
            >
              <option value="Order Support">Order & Delivery Support</option>
              <option value="Custom Cake Inquiry">Custom Cake Inquiry</option>
              <option value="Payment Inquiry">Payment & Refund Inquiry</option>
              <option value="Account Settings">Account Settings</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2C1E16] mb-1">Details & Message</label>
            <textarea
              rows={4}
              placeholder="Describe your inquiry or order issue in detail..."
              value={ticketForm.message}
              onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
              className="w-full p-3 rounded-xl border border-[#E8E2D9] text-xs outline-none focus:border-[#E67E22] bg-white"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Submit Support Ticket
          </Button>
        </form>
      </Modal>
    </div>
  );
};
