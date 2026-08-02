import React, { useState } from "react";
import { Bell, Lock, Shield, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/DisplayComponents";
import { Input } from "@/components/ui/FormControls";
import { useAuth } from "@/contexts/auth.context";

export const CustomerSettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "Bakery Customer");
  const [email, setEmail] = useState(user?.email || "customer@onebite.local");
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setMsg("Customer account settings saved successfully!");
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2C1E16]">Customer Account Settings</h1>
        <p className="text-xs text-[#6E5D4F]">Section 45 &bull; Manage security credentials, notifications, and profile details</p>
      </div>

      {msg ? (
        <div className="p-3 bg-green-50 text-green-800 text-xs font-bold rounded-xl border border-green-200">
          {msg}
        </div>
      ) : null}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2C1E16]">
            <User className="h-4 w-4 text-[#E67E22]" />
            <span>Profile Credentials</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <Input label="Registered Phone Number" value={user?.phone || "9876543210"} disabled readOnly />
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2C1E16]">
            <Bell className="h-4 w-4 text-[#E67E22]" />
            <span>Communication & Alerts</span>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
              <span>Transactional Order SMS Alerts (+91 {user?.phone})</span>
              <input
                type="checkbox"
                checked={smsNotifs}
                onChange={(e) => setSmsNotifs(e.target.checked)}
                className="rounded border-gray-300 text-[#E67E22] h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
              <span>Promotional Offers & Bakery Updates via Email</span>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="rounded border-gray-300 text-[#E67E22] h-4 w-4"
              />
            </label>
          </div>
        </Card>

        <Card className="space-y-3 bg-[#FFFBF5] border-[#E8E2D9]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2C1E16]">
            <Shield className="h-4 w-4 text-[#27AE60]" />
            <span>Security & Authentication</span>
          </div>
          <p className="text-xs text-[#6E5D4F]">
            Your account uses passwordless 1-step OTP phone verification. Login codes are sent to your mobile phone number.
          </p>
        </Card>

        <Button type="submit" className="w-full h-11" isLoading={isSaving}>
          Save Settings
        </Button>
      </form>
    </div>
  );
};
