import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { Badge, Card } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { UserAvatar, getAvatarFromEmailOrName } from "@/components/common/UserAvatar";
import { useAuth } from "@/contexts/auth.context";

export const CustomerProfilePage: React.FC = () => {
  const { user, updateUser, logout, logoutAll } = useAuth();

  const [name, setName] = useState(user?.name || "Bakery Customer");
  const [email, setEmail] = useState(user?.email || "customer@theonlinebakery.local");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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

  const handleUseEmailAvatar = () => {
    const generated = getAvatarFromEmailOrName(name, email);
    setProfileImage(generated);
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
              {user?.phone ? `+91 ${user.phone}` : user?.email || "Google Account"}
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
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <h4 className="text-xs font-bold text-[#3B302B]">Profile Photo</h4>
              <p className="text-[11px] text-[#7A6E65]">
                Your photo is visible across your orders, reviews, and customer greeting.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUseEmailAvatar}
                  className="text-xs h-8"
                >
                  <Camera className="h-3.5 w-3.5 mr-1 text-[#596B58]" />
                  <span>Generate Avatar from Email</span>
                </Button>
                {profileImage ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setProfileImage("")}
                    className="text-xs h-8 text-red-600 hover:bg-red-50"
                  >
                    Reset
                  </Button>
                ) : null}
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#3B302B]">Registered Mobile Number</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-mono">
              <span>+91 {user?.phone || "9876543210"}</span>
              <span className="text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full ml-auto">
                ✓ OTP Verified
              </span>
            </div>
            <p className="text-[11px] text-[#7A6E65]">
              Mobile number is your primary login credential.
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
