import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  User,
  Link2,
  Palette,
  Clock,
  MapPin,
  QrCode,
  BarChart3,
  ExternalLink,
  Smartphone,
  Sparkles,
} from "lucide-react";

import {
  businessHubService,
  type AdminHubData,
  type BusinessHubProfile,
  type BusinessLink,
  type BusinessDayHours,
  type BusinessHubAppearance,
} from "@/services/businessHub.service";
import { BakeryLoader } from "@/components/common/BakeryLoader";
import { AdminDashboardTab } from "./AdminDashboardTab";
import { AdminProfileTab } from "./AdminProfileTab";
import { AdminLinksTab } from "./AdminLinksTab";
import { AdminAppearanceTab } from "./AdminAppearanceTab";
import { AdminHoursTab } from "./AdminHoursTab";
import { AdminSocialLocationTab } from "./AdminSocialLocationTab";
import { AdminQRCodeTab } from "./AdminQRCodeTab";
import { AdminAnalyticsTab } from "./AdminAnalyticsTab";
import { PublicBusinessHubPage } from "../pages/PublicBusinessHubPage";

type ActiveTab =
  | "dashboard"
  | "profile"
  | "links"
  | "appearance"
  | "hours"
  | "social-location"
  | "qrcode"
  | "analytics";

export const AdminBusinessHubPage: React.FC = () => {
  const [data, setData] = useState<AdminHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [showLivePreview, setShowLivePreview] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await businessHubService.getAdminHub();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load Business Hub data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <BakeryLoader
          fullScreen={false}
          message="Loading OneBite Hub"
          subtext="Fetching business links & configurations"
          size="md"
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 space-y-4">
        <h3 className="text-lg font-bold text-stone-800">Failed to Load Business Hub</h3>
        <p className="text-sm text-stone-500">{error || "Something went wrong."}</p>
        <button
          type="button"
          onClick={loadData}
          className="px-5 py-2.5 rounded-xl bg-[#3B302B] text-white font-semibold text-xs cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { hub, links, analytics } = data;

  const handleProfileUpdated = (updated: BusinessHubProfile) => {
    setData((prev) => (prev ? { ...prev, hub: updated } : null));
  };

  const handleLinksUpdated = (updatedLinks: BusinessLink[]) => {
    setData((prev) => (prev ? { ...prev, links: updatedLinks } : null));
  };

  const handleHoursUpdated = (updatedHours: BusinessDayHours[]) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            hub: { ...prev.hub, businessHours: updatedHours },
            status: businessHubService.calculateBusinessStatus(updatedHours),
          }
        : null,
    );
  };

  const handleAppearanceUpdated = (updatedAppearance: BusinessHubAppearance) => {
    setData((prev) =>
      prev ? { ...prev, hub: { ...prev.hub, appearance: updatedAppearance } } : null,
    );
  };

  const NAV_ITEMS: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "profile", label: "Business Profile", icon: <User className="w-4 h-4" /> },
    { id: "links", label: "Links Manager", icon: <Link2 className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "hours", label: "Business Hours", icon: <Clock className="w-4 h-4" /> },
    { id: "social-location", label: "Social & Location", icon: <MapPin className="w-4 h-4" /> },
    { id: "qrcode", label: "QR Code", icon: <QrCode className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 mb-1">
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>Digital Business Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#3B302B]">
            OneBite Bakery Hub Administration
          </h1>
          <p className="text-xs text-stone-500">
            Control all public links, contact details, opening hours, and theme styles in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Mobile Simulator Toggle */}
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
              showLivePreview
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{showLivePreview ? "Hide Simulator" : "Live Mobile Simulator"}</span>
          </button>

          {/* External Public Link */}
          <a
            href="/business"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B302B] hover:bg-[#28211D] text-white text-xs font-bold transition-transform active:scale-95 shadow-xs cursor-pointer"
          >
            <span>Public Hub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Content Layout with optional side-by-side simulator */}
      <div className={`grid gap-6 ${showLivePreview ? "grid-cols-1 xl:grid-cols-12" : "grid-cols-1"}`}>
        {/* Left Column: Navigation Tabs & Tab Content */}
        <div className={showLivePreview ? "xl:col-span-7 space-y-6" : "space-y-6"}>
          {/* Horizontal Tabs Scrollable Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200 no-scrollbar">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === item.id
                    ? "bg-[#3B302B] text-[#FFF8EC] shadow-sm"
                    : "bg-white hover:bg-stone-100 text-stone-600 border border-stone-200"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Active Tab Component */}
          {activeTab === "dashboard" && (
            <AdminDashboardTab
              data={data}
              onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
              publicUrl="/business"
            />
          )}

          {activeTab === "profile" && (
            <AdminProfileTab
              initialProfile={hub}
              onProfileUpdated={handleProfileUpdated}
            />
          )}

          {activeTab === "links" && (
            <AdminLinksTab
              initialLinks={links}
              onLinksUpdated={handleLinksUpdated}
            />
          )}

          {activeTab === "appearance" && (
            <AdminAppearanceTab
              profile={hub}
              onAppearanceUpdated={handleAppearanceUpdated}
            />
          )}

          {activeTab === "hours" && (
            <AdminHoursTab
              profile={hub}
              onHoursUpdated={handleHoursUpdated}
            />
          )}

          {activeTab === "social-location" && (
            <AdminSocialLocationTab
              profile={hub}
              onProfileUpdated={handleProfileUpdated}
            />
          )}

          {activeTab === "qrcode" && (
            <AdminQRCodeTab
              businessName={hub.businessName}
              tagline={hub.tagline}
              publicUrl="/business"
            />
          )}

          {activeTab === "analytics" && (
            <AdminAnalyticsTab analytics={analytics} />
          )}
        </div>

        {/* Right Column: Live Mobile Simulator Frame (when active) */}
        {showLivePreview ? (
          <div className="xl:col-span-5 hidden xl:block">
            <div className="sticky top-6 bg-stone-900 rounded-[40px] p-3.5 shadow-2xl border-4 border-stone-800 max-w-[390px] mx-auto">
              {/* Phone Speaker & Camera Notch */}
              <div className="w-32 h-4 bg-black rounded-b-xl mx-auto mb-2 flex items-center justify-center">
                <div className="w-10 h-1 bg-stone-700 rounded-full" />
              </div>

              {/* Phone Screen Container with embedded Public View */}
              <div className="bg-white rounded-[32px] overflow-hidden h-[740px] overflow-y-auto no-scrollbar shadow-inner">
                <PublicBusinessHubPage />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
