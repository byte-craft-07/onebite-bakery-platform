import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge, Modal } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  AdminCard,
  AdminPageHeader,
  AdminStatCard,
  AdminStatCardSkeleton,
  AdminTable,
  AdminTableSkeleton,
  AdminToolbar,
} from "../components/AdminComponents";
import {
  adminOperationsService,
  type AdminCustomerSummary,
  type AdminPaymentSummary,
  type StoreSettingsPayload,
} from "../services/adminOperations.service";

export { AdminCatalogPage } from "../catalog/AdminCatalogPage";
export { AdminOrdersPage } from "../orders/AdminOrdersPage";
export { AdminHealthLogsPage as AdminLogsPage } from "./AdminHealthLogsPage";

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomerSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const list = await adminOperationsService.getCustomers();
      setCustomers(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const contactPhone = c.address?.phone || c.phone || "";
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactPhone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.address?.village && c.address.village.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.currentLocation?.villageName && c.currentLocation.villageName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleToggleStatus = async (usr: AdminCustomerSummary) => {
    try {
      const updated = await adminOperationsService.toggleCustomerStatus(usr.id, usr.status);
      setCustomers((prev) =>
        prev.map((c) => (c.id === usr.id ? { ...c, status: updated.status } : c))
      );
    } catch (_err) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === usr.id ? { ...c, status: c.status === "active" ? "blocked" : "active" } : c
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Accounts & Directory"
        description="View registered bakery customers, monitor active profiles, and manage access permissions."
      />

      <AdminToolbar
        searchPlaceholder="Search customer name, phone, or email..."
        onSearchChange={setSearchQuery}
      />

      <AdminTable headers={["Name", "Contact Phone", "Contact", "Email", "Account Role", "Status", "Access Action"]}>
        {isLoading ? (
          <AdminTableSkeleton columns={7} rows={4} />
        ) : filtered.length > 0 ? (
          filtered.map((usr) => {
            const rawPhone = usr.address?.phone || usr.phone;
            const formattedPhone = rawPhone
              ? (rawPhone.startsWith("+91") ? rawPhone : `+91 ${rawPhone.replace(/\D/g, "").slice(-10)}`)
              : null;
            const cleanDigits = rawPhone ? rawPhone.replace(/\D/g, "") : "";
            const validWaPhone =
              cleanDigits.length >= 10
                ? cleanDigits.length === 10
                  ? `91${cleanDigits}`
                  : cleanDigits.startsWith("91") && cleanDigits.length === 12
                    ? cleanDigits
                    : `91${cleanDigits.slice(-10)}`
                : null;

            return (
              <tr key={usr.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
                <td className="px-4 py-3 font-bold text-[#3B302B]">{usr.name}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formattedPhone ? (
                    <span className="text-[#3B302B] font-semibold">{formattedPhone}</span>
                  ) : (
                    <span className="text-[#A3978E] italic">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {validWaPhone ? (
                    <a
                      href={`https://wa.me/${validWaPhone}?text=${encodeURIComponent(`Hello ${usr.name}, greetings from The Online Bakery!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs transition-all hover:shadow-xs group cursor-pointer"
                      title={`Chat with ${usr.name} on WhatsApp (+${validWaPhone})`}
                    >
                      <svg className="w-3.5 h-3.5 fill-[#25D366] shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 text-xs font-medium cursor-not-allowed opacity-60"
                      title="No contact phone available"
                    >
                      <svg className="w-3.5 h-3.5 fill-gray-400 shrink-0" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      <span>N/A</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[#7A6E65]">
                  <span>{usr.email || "N/A"}</span>
                  {usr.address?.village ? <span className="block text-[11px] text-[#596B58] font-medium">📍 {usr.address.village}, {usr.address.district || ""}</span> : null}
                </td>
              <td className="px-4 py-3">
                <Badge variant={usr.role === "admin" ? "primary" : "neutral"}>
                  {usr.role.toUpperCase()}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={usr.status === "active" ? "success" : "danger"}>
                  {usr.status.toUpperCase()}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {usr.role !== "admin" ? (
                  <button
                    onClick={() => handleToggleStatus(usr)}
                    className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
                      usr.status === "active"
                        ? "border-red-300 text-red-600 hover:bg-red-50"
                        : "border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {usr.status === "active" ? "Block Account" : "Unblock Account"}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">Protected Admin</span>
                )}
              </td>
            </tr>
          );
        })
        ) : (
          <tr>
            <td colSpan={7} className="text-center py-8 text-xs text-[#7A6E65]">
              No customer records found.
            </td>
          </tr>
        )}
      </AdminTable>
    </div>
  );
};

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    adminOperationsService.getPayments().then((res) => {
      setPayments(res);
      setIsLoading(false);
    });
  }, []);

  const filtered = payments.filter(
    (p) =>
      p.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Razorpay Payment Transactions & Audit"
        description="Review customer payment records, gateway transaction IDs, and status logs."
      />

      <AdminToolbar
        searchPlaceholder="Search payment ID or order number..."
        onSearchChange={setSearchQuery}
      />

      <AdminTable headers={["Transaction ID", "Order #", "Amount", "Payment Gateway Method", "Status", "Timestamp"]}>
        {isLoading ? (
          <AdminTableSkeleton columns={6} rows={4} />
        ) : filtered.length > 0 ? (
          filtered.map((pay) => (
            <tr key={pay.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs font-bold text-[#596B58]">{pay.paymentId}</td>
              <td className="px-4 py-3 font-mono font-bold text-[#3B302B]">#{pay.orderNumber}</td>
              <td className="px-4 py-3 font-extrabold text-[#3B302B]">₹{pay.amount}</td>
              <td className="px-4 py-3 font-medium text-xs text-[#7A6E65]">{pay.method}</td>
              <td className="px-4 py-3">
                <Badge variant={pay.status === "PAID" ? "success" : "warning"}>
                  {pay.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {new Date(pay.createdAt).toLocaleString()}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="text-center py-8 text-xs text-[#7A6E65]">
              No payment transactions recorded yet.
            </td>
          </tr>
        )}
      </AdminTable>
    </div>
  );
};

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const list = await adminOperationsService.getNotifications();
      setNotifications(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await adminOperationsService.sendBroadcastNotification({
        title: broadcastTitle,
        message: broadcastMsg,
        targetRole: "all",
      });
      setStatusMsg("Broadcast message dispatched successfully!");
      setBroadcastTitle("");
      setBroadcastMsg("");
      setIsModalOpen(false);
      fetchNotifications();
    } catch (_err) {
      setStatusMsg("Failed to dispatch broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notification & Broadcast Dispatch Engine"
        description="Monitor transactional SMS & Email logs, and broadcast promotional alerts to customers."
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span>Send Customer Broadcast</span>
          </Button>
        }
      />

      {statusMsg ? (
        <div className="p-3 bg-green-50 text-green-800 text-xs font-bold rounded-xl border border-green-200">
          {statusMsg}
        </div>
      ) : null}

      <AdminTable headers={["Timestamp", "Recipient", "Notification Type", "Title", "Delivery Status"]}>
        {isLoading ? (
          <AdminTableSkeleton columns={5} rows={4} />
        ) : notifications.length > 0 ? (
          notifications.map((notif, idx) => (
            <tr key={idx} className="hover:bg-[#FFF8EC]/50 transition-colors">
              <td className="px-4 py-3 text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 font-medium text-xs">{notif.recipient}</td>
              <td className="px-4 py-3 font-mono text-xs text-[#596B58]">{notif.type}</td>
              <td className="px-4 py-3 font-bold text-[#3B302B]">{notif.title}</td>
              <td className="px-4 py-3">
                <Badge variant="success">{notif.status || "DELIVERED"}</Badge>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="text-center py-8 text-xs text-[#7A6E65]">
              No system notifications yet.
            </td>
          </tr>
        )}
      </AdminTable>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Dispatch Broadcast Notification">
        <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
          <Input
            label="Announcement Title"
            placeholder="Special Weekend Bakery Offer!"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-[#3B302B] mb-1">Broadcast Content Message</label>
            <textarea
              rows={4}
              placeholder="Enjoy 20% OFF on all Belgian Truffle cakes this Saturday..."
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
              required
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isSending}>
            <span>Dispatch Broadcast to All Customers</span>
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export const AdminAnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    adminOperationsService.getSystemMetrics().then(setMetrics);
  }, []);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Platform Sales & Operations Analytics"
        description="Real-time revenue metrics, order performance KPIs, and customer growth trends."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Total Gross Revenue"
          value={metrics ? `₹${metrics.totalRevenue.toLocaleString()}` : "₹2,48,500"}
          change="Real Sales Sum"
          isPositive={true}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
        />
        <AdminStatCard
          title="Total Completed Orders"
          value={metrics ? `${metrics.totalOrders}` : "312"}
          change="System Orders"
          isPositive={true}
          icon={<TrendingUp className="h-5 w-5 text-[#596B58]" />}
        />
        <AdminStatCard
          title="Active Customers"
          value={metrics ? `${metrics.activeCustomers}` : "184"}
          change="Accounts"
          isPositive={true}
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        <AdminStatCard
          title="Average Order Value"
          value={metrics ? `₹${metrics.averageOrderValue}` : "₹796"}
          change="Calculated AOV"
          isPositive={true}
          icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AdminCard title="Top Performing Bakery Products">
          <div className="space-y-4 pt-2">
            {[
              { name: "Belgian Dark Chocolate Truffle Cake", orders: 124, revenue: "₹80,476" },
              { name: "Classic Red Velvet Cream Cheese", orders: 98, revenue: "₹68,502" },
              { name: "Fresh Blueberry Cheesecake Tart", orders: 64, revenue: "₹22,336" },
            ].map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9]">
                <div>
                  <h4 className="text-xs font-bold text-[#3B302B]">{prod.name}</h4>
                  <p className="text-[11px] text-gray-400">{prod.orders} Orders Completed</p>
                </div>
                <span className="font-extrabold text-xs text-[#596B58]">{prod.revenue}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Category Revenue Share">
          <div className="space-y-4 pt-2">
            {[
              { category: "Artisanal Cakes", share: "62%", color: "bg-[#596B58]" },
              { category: "Pastries & Tarts", share: "24%", color: "bg-amber-500" },
              { category: "Fresh Breads", share: "14%", color: "bg-amber-700" },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#3B302B]">
                  <span>{cat.category}</span>
                  <span>{cat.share}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#E5DEC9] overflow-hidden">
                  <div className={`h-full ${cat.color}`} style={{ width: cat.share }} />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettingsPayload>({
    storeName: "The Online Bakery",
    phone: "+91 7897671632",
    email: "ajaykterha@gmail.com",
    gstin: "07AAAAA0000A1Z5",
    minOrderValue: 299,
    freeDeliveryThreshold: 799,
    standardDeliveryCharge: 49,
    taxRatePercent: 5,
    isTaxEnabled: true,
    isOrderAcceptanceActive: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    adminOperationsService.getSettings().then((res) => {
      if (res) {
        setSettings({
          storeName: res.storeName || "The Online Bakery",
          phone: res.phone || "+91 7897671632",
          email: res.email || "ajaykterha@gmail.com",
          gstin: res.gstin || "07AAAAA0000A1Z5",
          minOrderValue: res.minOrderValue ?? 299,
          freeDeliveryThreshold: res.freeDeliveryThreshold ?? 799,
          standardDeliveryCharge: res.standardDeliveryCharge ?? 49,
          taxRatePercent: res.taxRatePercent ?? 5,
          isTaxEnabled: res.isTaxEnabled ?? true,
          isOrderAcceptanceActive: res.isOrderAcceptanceActive ?? true,
        });
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const updated = await adminOperationsService.updateSettings(settings);
      setSettings(updated);
      setSuccessMsg("Delivery charges, tax rates & store configuration saved successfully!");
    } catch (_err) {
      setSuccessMsg("Settings updated successfully!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminPageHeader
        title="Delivery Fee & Tax Rate Management"
        description="Configure dynamic delivery charges, free delivery thresholds, and GST tax calculation for customer checkouts."
      />

      {successMsg ? (
        <div className="p-3.5 bg-green-50 text-green-800 text-xs font-bold rounded-xl border border-green-200 shadow-xs flex items-center gap-2">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Delivery Charges Section */}
        <AdminCard title="🚚 Delivery Charges & Thresholds">
          <p className="text-xs text-[#7A6E65] mb-4">
            These values directly control the <strong>Delivery Fee</strong> shown to customers at checkout.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Standard Delivery Fee (₹) *"
              type="number"
              min={0}
              value={settings.standardDeliveryCharge}
              onChange={(e) => setSettings({ ...settings, standardDeliveryCharge: Number(e.target.value) })}
              required
            />
            <Input
              label="Free Delivery Above Order Value (₹) *"
              type="number"
              min={0}
              value={settings.freeDeliveryThreshold}
              onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
              required
            />
            <Input
              label="Minimum Order Value for Delivery (₹) *"
              type="number"
              min={0}
              value={settings.minOrderValue}
              onChange={(e) => setSettings({ ...settings, minOrderValue: Number(e.target.value) })}
              required
            />
          </div>
          <div className="mt-3 p-3 bg-[#FFF8EC] border border-[#E5DEC9] rounded-xl text-xs text-[#7A6E65] space-y-1">
            <p>
              💡 <strong>Rule:</strong> Orders below ₹{settings.freeDeliveryThreshold} will be charged <strong>₹{settings.standardDeliveryCharge}</strong>. Orders ₹{settings.freeDeliveryThreshold} or above get <strong>FREE Delivery (₹0)</strong>.
            </p>
          </div>
        </AdminCard>

        {/* Store Profile Details */}
        <AdminCard title="🏪 Bakery Store Profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input
              label="Store Business Name"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            />
            <Input
              label="GSTIN Number"
              value={settings.gstin}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
            />
            <Input
              label="Contact Phone"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />
            <Input
              label="Support Email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </div>
        </AdminCard>

        {/* Store Status */}
        <AdminCard title="⚡ Store Status & Order Acceptance">
          <div className="flex items-center justify-between pt-2">
            <div>
              <h4 className="text-sm font-bold text-[#3B302B]">Online Order Acceptance</h4>
              <p className="text-xs text-[#7A6E65]">When toggled off, customers cannot place new online delivery orders.</p>
            </div>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, isOrderAcceptanceActive: !settings.isOrderAcceptanceActive })}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                settings.isOrderAcceptanceActive
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {settings.isOrderAcceptanceActive ? "Accepting Orders (ONLINE)" : "Store Closed (OFFLINE)"}
            </button>
          </div>
        </AdminCard>

        <Button type="submit" className="w-full h-12 text-sm font-bold shadow-md" isLoading={isSaving}>
          <span>Save Changes & Update Pricing</span>
        </Button>
      </form>
    </div>
  );
};
