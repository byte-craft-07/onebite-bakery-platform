import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
} from "lucide-react";

import { Badge, Card } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { UserAvatar, getAvatarFromEmailOrName } from "@/components/common/UserAvatar";
import { useAuth } from "@/contexts/auth.context";
import { addressService, type Address } from "@/services/address.service";
import { googleAuthService } from "@/services/googleAuth.service";

export const CustomerProfilePage: React.FC = () => {
  const { user, updateUser, logout, logoutAll } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "Bakery Customer");
  const [email, setEmail] = useState(user?.email || "customer@onebitebakery.local");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    addressService
      .getAddresses()
      .then((addrs) => {
        const primary = addrs.find((a) => a.isDefault) || addrs[0] || null;
        setDefaultAddress(primary);
      })
      .catch(() => null);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    updateUser({
      name: name.trim(),
      email: email.trim(),
      profileImage: profileImage.trim() || undefined,
    });

    setTimeout(() => {
      setIsSaving(false);
      setStatusMsg("Personal profile information updated successfully!");
      setTimeout(() => setStatusMsg(null), 3000);
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setProfileImage(dataUrl);
        updateUser({ profileImage: dataUrl });
        setStatusMsg("Profile photo uploaded successfully!");
        setTimeout(() => setStatusMsg(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleSync = () => {
    googleAuthService.redirectToGoogleOAuth();
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E65] hover:text-[#596B58] transition-colors mb-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Account Hub</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B] flex items-center gap-2">
          <User className="h-6 w-6 text-[#596B58]" />
          <span>Personal Profile & Details</span>
        </h1>
        <p className="text-xs text-[#7A6E65]">
          Manage your personal information, avatar photo, and linked contact credentials
        </p>
      </div>

      {statusMsg ? (
        <div className="p-3.5 bg-green-50 text-green-800 text-xs font-bold rounded-2xl border border-green-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      ) : null}

      {/* Profile Overview Card */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#FFF8EC] to-[#FFF8EC] border-[#E5DEC9]">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <UserAvatar
            user={{ name, email, profileImage }}
            size="2xl"
            className="border-2 border-[#596B58]/30 shadow-md shrink-0 ring-4 ring-white"
          />
          <div>
            <h2 className="text-xl font-extrabold text-[#3B302B]">{user?.name || "Customer"}</h2>
            <p className="text-xs text-[#7A6E65] mt-0.5">
              {defaultAddress?.phone
                ? `📞 +91 ${defaultAddress.phone}`
                : user?.email || "Google Account"}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="success">Account: Active</Badge>
              <Badge variant="primary">Role: {user?.role || "customer"}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "admin" ? (
            <Link to="/admin/dashboard">
              <Button size="sm" className="bg-[#3B302B] text-white hover:bg-[#1E1713] flex items-center gap-1.5 shadow-md">
                <LayoutDashboard className="h-4 w-4 text-[#596B58]" />
                <span>Admin Panel</span>
              </Button>
            </Link>
          ) : null}

          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1 text-gray-500" />
            <span>Logout</span>
          </Button>

          <Button variant="danger" size="sm" onClick={logoutAll}>
            <Shield className="h-4 w-4 mr-1" />
            <span>Logout All Devices</span>
          </Button>
        </div>
      </Card>

      {/* Edit Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <Card className="space-y-6 border-[#E5DEC9]">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#3B302B] border-b border-[#E5DEC9] pb-3">
            <User className="h-4 w-4 text-[#596B58]" />
            <span>Edit Personal Information</span>
          </div>

          {/* Avatar controls */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9]">
            <UserAvatar
              user={{ name, email, profileImage }}
              size="xl"
              className="border-2 border-[#596B58]/40 shadow-sm shrink-0"
            />
            <div className="space-y-3 text-center sm:text-left flex-1">
              <div>
                <h4 className="text-xs font-bold text-[#3B302B]">Profile Photo</h4>
                <p className="text-[11px] text-[#7A6E65]">
                  Upload a photo from your device, sync with Google Sign-In, or pick a preset avatar.
                </p>
              </div>

              {/* Action Buttons: Upload from device & Google Sync */}
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#596B58] hover:bg-[#495948] text-white text-xs h-8 flex items-center gap-1.5 shadow-2xs font-bold"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Photo from Device</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGoogleSync}
                  className="text-xs h-8 flex items-center gap-1.5 border-[#E5DEC9] hover:bg-[#FFF8EC] text-[#3B302B] font-bold"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sync Google Photo</span>
                </Button>

                {profileImage ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setProfileImage("")}
                    className="text-xs h-8 text-red-600 hover:bg-red-50"
                  >
                    Reset to Initial Badge
                  </Button>
                ) : null}
              </div>

              {/* Quick Preset Avatars */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 justify-center sm:justify-start">
                <span className="text-[10px] text-[#7A6E65] font-semibold mr-1">Presets:</span>
                {[
                  { label: "Chef 👨‍🍳", url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80" },
                  { label: "Baker 🥐", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&auto=format&fit=crop&q=80" },
                  { label: "Pastry 🍰", url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80" },
                  { label: "Master 👑", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setProfileImage(preset.url)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      profileImage === preset.url
                        ? "bg-[#596B58] text-white border-[#596B58] shadow-xs"
                        : "bg-white text-[#3B302B] border-[#E5DEC9] hover:bg-[#F7F2E7]"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Ajay Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address *"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Input
              label="Custom Profile Image URL (Optional)"
              type="url"
              placeholder="https://images.unsplash.com/... or paste image URL"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
            />
          </div>

          {/* Contact Mobile & Address Source of Truth */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3B302B]">Contact Mobile & Delivery Address</label>
              <Link to="/customer/addresses" className="text-xs font-bold text-[#596B58] hover:underline">
                {defaultAddress ? "Manage Addresses" : "+ Add Delivery Address"}
              </Link>
            </div>
            {defaultAddress ? (
              <div className="p-3.5 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-1 text-xs text-[#3B302B]">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm">📞 +91 {defaultAddress.phone}</span>
                  <Badge variant="neutral">Address Contact</Badge>
                </div>
                <p className="text-[11px] text-[#7A6E65]">
                  📍 {defaultAddress.street}, {defaultAddress.village ? `${defaultAddress.village}, ` : ""}{defaultAddress.district || defaultAddress.city || "Central"} - {defaultAddress.pincode}
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-[#7A6E65] flex items-center justify-between">
                <span>No delivery address saved yet. Save an address to configure contact mobile number.</span>
                <Link to="/customer/addresses">
                  <Button size="sm" variant="outline" className="text-xs">Add Address</Button>
                </Link>
              </div>
            )}
            <p className="text-[11px] text-[#7A6E65]">
              Mobile number is required for order and delivery contact, collected with your delivery address.
            </p>
          </div>

          <Button type="submit" className="w-full sm:w-auto h-10 px-6 shadow-sm" isLoading={isSaving}>
            Save Profile Changes
          </Button>
        </Card>
      </form>

      {/* Quick Navigation Cards to Related Sections (Clean & Single-Responsibility) */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-[#3B302B]">Related Account Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/customer/addresses" className="block group">
            <Card className="p-4 border-[#E5DEC9] group-hover:border-[#596B58] group-hover:shadow-sm transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#3B302B] group-hover:text-[#596B58]">
                    Delivery Addresses
                  </h4>
                  <p className="text-[11px] text-[#7A6E65]">Manage saved locations</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#596B58] transition-colors" />
            </Card>
          </Link>

          <Link to="/customer/settings" className="block group">
            <Card className="p-4 border-[#E5DEC9] group-hover:border-[#596B58] group-hover:shadow-sm transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#3B302B] group-hover:text-[#596B58]">
                    Notifications
                  </h4>
                  <p className="text-[11px] text-[#7A6E65]">SMS & email alerts</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#596B58] transition-colors" />
            </Card>
          </Link>

          <Link to="/customer/security" className="block group">
            <Card className="p-4 border-[#E5DEC9] group-hover:border-[#596B58] group-hover:shadow-sm transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#3B302B] group-hover:text-[#596B58]">
                    Security Center
                  </h4>
                  <p className="text-[11px] text-[#7A6E65]">Devices & sessions</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#596B58] transition-colors" />
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};
