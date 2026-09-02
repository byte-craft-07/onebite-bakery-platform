import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/DisplayComponents";
import { useAuth } from "@/contexts/auth.context";

export const CustomerSettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [smsNotifs, setSmsNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [whatsappNotifs, setWhatsappNotifs] = useState(true);
  const [celebrationAlerts, setCelebrationAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setMsg("Communication and notification preferences updated!");
      setTimeout(() => setMsg(null), 3000);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <Link
        to="/customer/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Account Hub</span>
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-[#3B302B] flex items-center gap-2">
          <Bell className="h-6 w-6 text-[#596B58]" />
          <span>Notification & Alert Settings</span>
        </h1>
        <p className="text-xs text-[#7A6E65]">
          Customize how you receive order updates, fresh baking alerts, and celebration discount offers
        </p>
      </div>

      {msg ? (
        <div className="p-3.5 bg-green-50 text-green-800 text-xs font-bold rounded-2xl border border-green-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>{msg}</span>
        </div>
      ) : null}

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Order Alerts */}
        <Card className="space-y-4 border-[#E5DEC9]">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#3B302B] border-b border-[#E5DEC9] pb-3">
            <Phone className="h-4 w-4 text-[#596B58]" />
            <span>Order Updates & Tracking Channels</span>
          </div>

          <div className="space-y-4">
            <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9] cursor-pointer hover:border-[#596B58]/50 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-[#3B302B] block">
                  Transactional SMS Notifications (+91 {user?.phone || "Phone"})
                </span>
                <span className="text-[11px] text-[#7A6E65]">
                  Receive live OTPs, order confirmation, and dispatch SMS alerts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={smsNotifs}
                onChange={(e) => setSmsNotifs(e.target.checked)}
                className="rounded border-gray-300 text-[#596B58] h-4 w-4 mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9] cursor-pointer hover:border-[#596B58]/50 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-[#3B302B] block">
                  WhatsApp Instant Live Order Updates
                </span>
                <span className="text-[11px] text-[#7A6E65]">
                  Receive delivery agent contact & live tracking link on WhatsApp.
                </span>
              </div>
              <input
                type="checkbox"
                checked={whatsappNotifs}
                onChange={(e) => setWhatsappNotifs(e.target.checked)}
                className="rounded border-gray-300 text-[#596B58] h-4 w-4 mt-1"
              />
            </label>
          </div>
        </Card>

        {/* Promotional & Celebration Alerts */}
        <Card className="space-y-4 border-[#E5DEC9]">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#3B302B] border-b border-[#E5DEC9] pb-3">
            <Sparkles className="h-4 w-4 text-[#596B58]" />
            <span>Bakery Offers & Occasions</span>
          </div>

          <div className="space-y-4">
            <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9] cursor-pointer hover:border-[#596B58]/50 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-[#3B302B] block">
                  Celebration Event Reminders
                </span>
                <span className="text-[11px] text-[#7A6E65]">
                  Advance reminder alerts 3 days prior to saved birthdays and anniversaries.
                </span>
              </div>
              <input
                type="checkbox"
                checked={celebrationAlerts}
                onChange={(e) => setCelebrationAlerts(e.target.checked)}
                className="rounded border-gray-300 text-[#596B58] h-4 w-4 mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#FFF8EC] border border-[#E5DEC9] cursor-pointer hover:border-[#596B58]/50 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-[#3B302B] block">
                  Exclusive Promotional Offers ({user?.email || "Email"})
                </span>
                <span className="text-[11px] text-[#7A6E65]">
                  Occasional newsletter on festive cakes, weekend discounts, and new menu additions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="rounded border-gray-300 text-[#596B58] h-4 w-4 mt-1"
              />
            </label>
          </div>
        </Card>

        <Button type="submit" className="w-full sm:w-auto h-10 px-6 shadow-sm" isLoading={isSaving}>
          Save Notification Preferences
        </Button>
      </form>

      {/* Quick Navigation Cards */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-extrabold text-[#3B302B]">Related Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/customer/profile" className="block group">
            <Card className="p-4 border-[#E5DEC9] group-hover:border-[#596B58] transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#3B302B] group-hover:text-[#596B58]">
                    Edit Profile Details
                  </h4>
                  <p className="text-[11px] text-[#7A6E65]">Name, avatar photo & email</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#596B58] transition-colors" />
            </Card>
          </Link>

          <Link to="/customer/security" className="block group">
            <Card className="p-4 border-[#E5DEC9] group-hover:border-[#596B58] transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-50 text-green-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#3B302B] group-hover:text-[#596B58]">
                    Account Security Center
                  </h4>
                  <p className="text-[11px] text-[#7A6E65]">Active login sessions & devices</p>
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
