import React from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  QrCode,
  Eye,
  MousePointerClick,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Layers,
} from "lucide-react";

import type { AdminHubData } from "@/services/businessHub.service";

interface AdminDashboardTabProps {
  data: AdminHubData;
  onNavigateTab: (tabId: string) => void;
  publicUrl: string;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  data,
  onNavigateTab,
  publicUrl,
}) => {
  const { hub, links, analytics, status } = data;
  const activeLinksCount = links.filter((l) => l.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-gradient-to-r from-[#3B302B] via-[#4A3C36] to-[#2E2521] text-[#FFF8EC] p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>OneBite Bakery Hub Control</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {hub.businessName}
          </h2>
          <p className="text-sm text-stone-300">
            {hub.tagline || "Manage your digital business profile, links, hours, and branding in real time."}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <a
            href="/business"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#3B302B] font-bold text-xs sm:text-sm hover:bg-[#FFF8EC] transition-transform active:scale-95 shadow-md cursor-pointer"
          >
            <span>Open Public Page</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => onNavigateTab("qrcode")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-transform active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Generate QR</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-800">
            {analytics.totalViews.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-400 font-medium">Unique hub visits</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Clicks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-800">
            {analytics.totalClicks.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-400 font-medium">Link & action interactions</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Links</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-800">
            {activeLinksCount} <span className="text-sm font-normal text-stone-400">/ {links.length}</span>
          </p>
          <span className="text-[11px] text-stone-400 font-medium">Published on public hub</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Store Status</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${status.isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${status.isOpen ? "text-emerald-700" : "text-amber-800"}`}>
            {status.statusText}
          </p>
          <span className="text-[11px] text-stone-400 font-medium">
            {status.nextOpenText || "Live timezone calculation"}
          </span>
        </div>
      </div>

      {/* Top Performing Links Table & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Links */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-stone-800">Top Performing Links</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("links")}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage all links</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {analytics.topLinks.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {analytics.topLinks.map((tl, index) => (
                <div key={tl._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-800 truncate">{tl.title}</p>
                      <p className="text-xs text-stone-400 truncate font-mono">{tl.url}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-stone-800">{tl.clickCount}</span>
                    <span className="text-[11px] text-stone-400 block">clicks</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 py-6 text-center">
              No link clicks recorded yet. Share your Business Hub URL to start seeing clicks!
            </p>
          )}
        </div>

        {/* Quick Hub Settings Shortcuts */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-stone-800">Quick Actions</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigateTab("profile")}
              className="w-full text-left p-3 rounded-2xl hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-stone-800">Edit Business Info</p>
                <p className="text-[11px] text-stone-400">Name, logo, tagline & description</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("links")}
              className="w-full text-left p-3 rounded-2xl hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-stone-800">Add / Reorder Links</p>
                <p className="text-[11px] text-stone-400">Drag & drop buttons & icons</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("hours")}
              className="w-full text-left p-3 rounded-2xl hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-stone-800">Configure Hours</p>
                <p className="text-[11px] text-stone-400">Weekly schedule & open status</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("appearance")}
              className="w-full text-left p-3 rounded-2xl hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-stone-800">Appearance & Theme</p>
                <p className="text-[11px] text-stone-400">Bakery presets & button shapes</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
