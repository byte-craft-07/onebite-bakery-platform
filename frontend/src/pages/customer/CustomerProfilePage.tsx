import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building, Home, LogOut, MapPin, Plus, Shield, Trash2 } from "lucide-react";

import { Badge, Card, Modal, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { useAuth } from "@/contexts/auth.context";
import { addressService, type Address } from "@/services/address.service";

const addressSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Valid 10-digit phone required."),
  street: z.string().trim().min(5, "Full street address required."),
  city: z.string().trim().min(2, "City required."),
  state: z.string().trim().min(2, "State required."),
  pincode: z.string().trim().regex(/^\d{6}$/, "Valid 6-digit pincode required."),
  landmark: z.string().trim().optional(),
  addressType: z.enum(["HOME", "WORK", "OTHER"]).optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export const CustomerProfilePage: React.FC = () => {
  const { user, logout, logoutAll } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressType: "HOME",
    },
  });

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const list = await addressService.getAddresses();
      setAddresses(list);
    } catch (_err) {
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (data: AddressFormData) => {
    setAddressError(null);
    try {
      await addressService.createAddress({
        ...data,
        addressType: data.addressType || "HOME",
      });
      setIsAddModalOpen(false);
      addressForm.reset();
      fetchAddresses();
    } catch (err: any) {
      setAddressError(err?.response?.data?.error?.message || "Failed to create address.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await addressService.deleteAddress(id);
      fetchAddresses();
    } catch (_err) {
      // Ignore
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id);
      fetchAddresses();
    } catch (_err) {
      // Ignore
    }
  };

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Header Profile Card */}
      <Card className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#FFFBF5] to-[#FFF3E6] border-[#E8E2D9]">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="h-16 w-16 rounded-full bg-[#E67E22] text-white flex items-center justify-center font-bold text-2xl shadow-md">
            {user?.name?.[0]?.toUpperCase() || user?.phone?.[0] || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2C1E16]">{user?.name || "Customer Account"}</h1>
            <p className="text-sm text-[#6E5D4F]">+91 {user?.phone}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary">Account Status: Active</Badge>
              <Badge variant="neutral">Role: {user?.role}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1.5" />
            <span>Logout</span>
          </Button>
          <Button variant="danger" size="sm" onClick={logoutAll}>
            <Shield className="h-4 w-4 mr-1.5" />
            <span>Logout All Devices</span>
          </Button>
        </div>
      </Card>

      {/* Address Management Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#2C1E16]">Saved Delivery Addresses</h2>
            <p className="text-xs text-[#6E5D4F]">Manage your delivery locations for fast checkout</p>
          </div>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add New Address</span>
          </Button>
        </div>

        {isLoadingAddresses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <Card key={addr.id} className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {addr.addressType === "HOME" ? <Home className="h-4 w-4 text-[#E67E22]" /> : <Building className="h-4 w-4 text-[#E67E22]" />}
                    <span className="text-xs font-bold uppercase">{addr.addressType}</span>
                    {addr.isDefault ? <Badge variant="success">Default</Badge> : null}
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    aria-label="Delete Address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-xs text-[#6E5D4F] space-y-1">
                  <p className="font-bold text-[#2C1E16]">{addr.name} ({addr.phone})</p>
                  <p>{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  {addr.landmark ? <p className="text-gray-400">Landmark: {addr.landmark}</p> : null}
                </div>

                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-semibold text-[#E67E22] hover:underline"
                  >
                    Set as Default
                  </button>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 space-y-3 border-dashed">
            <MapPin className="h-8 w-8 text-[#E67E22] mx-auto opacity-60" />
            <p className="text-sm text-[#6E5D4F]">No saved delivery addresses found.</p>
            <Button size="sm" variant="outline" onClick={() => setIsAddModalOpen(true)}>
              Add Address
            </Button>
          </Card>
        )}
      </div>

      {/* Add Address Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Delivery Address">
        <form onSubmit={addressForm.handleSubmit(handleAddAddress)} className="space-y-4 pt-2">
          {addressError ? (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
              {addressError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Recipient Name" placeholder="Jane Doe" {...addressForm.register("name")} error={addressForm.formState.errors.name?.message} />
            <Input label="Recipient Phone" placeholder="9876543210" {...addressForm.register("phone")} error={addressForm.formState.errors.phone?.message} />
          </div>

          <Input label="Street Address" placeholder="123 Bakery Lane, Apt 4B" {...addressForm.register("street")} error={addressForm.formState.errors.street?.message} />

          <div className="grid grid-cols-3 gap-3">
            <Input label="City" placeholder="New Delhi" {...addressForm.register("city")} error={addressForm.formState.errors.city?.message} />
            <Input label="State" placeholder="Delhi" {...addressForm.register("state")} error={addressForm.formState.errors.state?.message} />
            <Input label="Pincode" placeholder="110001" maxLength={6} {...addressForm.register("pincode")} error={addressForm.formState.errors.pincode?.message} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input type="checkbox" {...addressForm.register("isDefault")} className="rounded border-gray-300 text-[#E67E22]" />
              <span>Set as default delivery address</span>
            </label>
          </div>

          <Button type="submit" className="w-full mt-4">
            Save Address
          </Button>
        </form>
      </Modal>
    </div>
  );
};
