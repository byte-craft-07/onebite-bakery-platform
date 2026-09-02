import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Home, MapPin, Plus, Trash2, Building, AlertCircle } from "lucide-react";

import { Badge, Card, EmptyState, Modal, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/contexts/toast.context";
import { addressService, type Address } from "@/services/address.service";
import { villageService, type Village } from "@/services/village.service";

export const CustomerAddressesPage: React.FC = () => {
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    village: "",
    district: "Central",
    pincode: "110001",
    street: "",
    landmark: "",
    addressType: "HOME" as "HOME" | "WORK" | "OTHER",
    isDefault: false,
  });

  const loadAddressesAndVillages = async () => {
    setIsLoading(true);
    try {
      const [addrs, vList] = await Promise.all([
        addressService.getAddresses().catch(() => []),
        villageService.getVillages().catch(() => []),
      ]);
      setAddresses(addrs);
      setVillages(vList);
      if (vList.length > 0 && !form.village) {
        setForm((prev) => ({
          ...prev,
          village: vList[0].name,
          district: vList[0].district,
          pincode: vList[0].pincode,
        }));
      }
    } catch (_err) {
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddressesAndVillages();
  }, []);

  const handleVillageChange = (selectedVillageName: string) => {
    const matched = villages.find((v) => v.name === selectedVillageName);
    setForm((prev) => ({
      ...prev,
      village: selectedVillageName,
      district: matched?.district || prev.district,
      pincode: matched?.pincode || prev.pincode,
    }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.street.trim() || !form.phone.trim()) {
      setStatusMsg({ type: "error", text: "Please enter your full street address and phone number." });
      toast.error("Invalid Address", "Please fill in your street address and 10-digit phone number.");
      return;
    }

    try {
      const created = await addressService.createAddress({
        name: form.name.trim() || user?.name || "Customer",
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        street: form.street.trim(),
        village: form.village || undefined,
        district: form.district || undefined,
        city: form.district || "Delhi",
        state: "Delhi",
        pincode: form.pincode.trim() || "110001",
        addressType: form.addressType,
        isDefault: form.isDefault || addresses.length === 0,
      });

      setAddresses((prev) => [...prev, created]);
      setIsAddModalOpen(false);
      setForm({
        name: user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
        village: villages[0]?.name || "",
        district: villages[0]?.district || "Central",
        pincode: villages[0]?.pincode || "110001",
        street: "",
        landmark: "",
        addressType: "HOME",
        isDefault: false,
      });
      setStatusMsg({ type: "success", text: "Delivery address added successfully!" });
      toast.add("Address Added!", `${created.name} (${created.village || created.district}) added to address book.`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      const errorText = err?.response?.data?.error?.message || "Failed to save address. Please try again.";
      setStatusMsg({
        type: "error",
        text: errorText,
      });
      toast.error("Save Failed", errorText);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await addressService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setStatusMsg({ type: "success", text: "Address removed from your address book." });
      toast.delete("Address Removed", "Delivery address was deleted.");
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (_err) {
      setStatusMsg({ type: "error", text: "Failed to delete address." });
      toast.error("Delete Failed", "Could not remove address.");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id);
      const updated = await addressService.getAddresses();
      setAddresses(updated);
      setStatusMsg({ type: "success", text: "Default delivery address updated." });
      toast.update("Default Address Updated", "Your default delivery location has been set.");
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (_err) {
      toast.error("Update Failed", "Could not set default address.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Mobile & Desktop Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DEC9] pb-4">
        <div className="space-y-1">
          <Link
            to="/customer/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E65] hover:text-[#596B58] transition-colors mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Account Hub</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B] flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#596B58]" />
            <span>Saved Delivery Addresses</span>
          </h1>
          <p className="text-xs text-[#7A6E65]">
            Manage your home, office, and celebration delivery destinations for 1-click checkout
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Address</span>
        </Button>
      </div>

      {statusMsg ? (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            statusMsg.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      ) : null}

      {/* Addresses List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <Card
              key={addr.id}
              className={`p-5 space-y-4 relative flex flex-col justify-between transition-all ${
                addr.isDefault
                  ? "border-[#596B58]/60 bg-[#FFF8EC] shadow-xs ring-1 ring-[#596B58]/20"
                  : "border-[#E5DEC9] bg-white hover:border-[#596B58]/40"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {addr.addressType === "WORK" ? (
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <Building className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-[#FFF8EC] text-[#596B58]">
                        <Home className="h-4 w-4" />
                      </div>
                    )}
                    <span className="text-xs font-extrabold uppercase text-[#3B302B]">
                      {addr.addressType || "HOME"}
                    </span>
                  </div>
                  {addr.isDefault ? (
                    <Badge variant="success">Default Address</Badge>
                  ) : null}
                </div>

                <div className="text-xs text-[#7A6E65] space-y-1 pt-1">
                  <p className="font-extrabold text-sm text-[#3B302B]">{addr.name}</p>
                  <p className="font-semibold text-[#3B302B]">📞 +91 {addr.phone}</p>
                  {addr.email ? <p className="text-gray-400">✉️ {addr.email}</p> : null}
                  <p className="text-[#3B302B] pt-1">
                    {addr.street}
                  </p>
                  <p className="font-medium text-[#7A6E65]">
                    {addr.village ? `Village: ${addr.village}, ` : ""}
                    {addr.district || addr.city || "Central"}, {addr.state || "Delhi"} - {addr.pincode}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>

                {!addr.isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-bold text-[#596B58] hover:text-[#495948] hover:underline cursor-pointer transition-colors"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[11px] text-green-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Active Delivery Location</span>
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Delivery Addresses Saved"
          description="Save your delivery address now for seamless 1-click orders and real-time fresh bakery delivery."
          action={
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Your First Address</span>
            </Button>
          }
        />
      )}

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Delivery Address"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Recipient Full Name *"
              placeholder="e.g. Ajay Kumar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Contact Phone Number *"
              placeholder="9876543210"
              maxLength={10}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3B302B] flex items-center justify-between">
                <span>Select Village / Area *</span>
                <span className="text-[10px] text-[#596B58]">The Online Bakery Delivery Network</span>
              </label>
              <select
                value={form.village}
                onChange={(e) => handleVillageChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] focus:outline-none focus:border-[#596B58]"
                required
              >
                <option value="">-- Select Village / Area --</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name} ({v.district})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Pincode / ZIP *"
              placeholder="110001"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="District *"
              placeholder="Central"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              required
            />
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3B302B]">Address Tag</label>
              <div className="flex gap-2">
                {(["HOME", "WORK", "OTHER"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, addressType: type })}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      form.addressType === type
                        ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58]"
                        : "border-[#E5DEC9] bg-white text-[#7A6E65]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Street Address / House / Flat No. *"
            placeholder="Flat 402, Sunshine Heights, Near Temple"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            required
          />

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-[#596B58] h-4 w-4"
              />
              <span>Set as default delivery address</span>
            </label>
          </div>

          <Button type="submit" className="w-full mt-4">
            Save Delivery Address
          </Button>
        </form>
      </Modal>
    </div>
  );
};
