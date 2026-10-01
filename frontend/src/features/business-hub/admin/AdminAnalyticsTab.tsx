import React from "react";
import {
  BarChart3,
  MousePointerClick,
  Smartphone,
  Tablet,
  Monitor,
  ShoppingBag,
  MessageCircle,
  Phone,
  MapPin,
  Share2,
} from "lucide-react";

import { InstagramIcon } from "../components/SocialIcons";
import type { AnalyticsSummary } from "@/services/businessHub.service";

interface AdminAnalyticsTabProps {
  analytics: AnalyticsSummary;
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ analytics }) => {
  const { totalViews, totalClicks, clicksByEvent, clicksByDevice, topLinks } = analytics;

  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  const actionItems: Array<{
    label: string;
    key: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      label: "Website Order Clicks",
      key: "order_website",
      icon: <ShoppingBag className="w-4 h-4" />,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "WhatsApp Orders",
      key: "whatsapp",
      icon: <MessageCircle className="w-4 h-4" />,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Phone Calls",
      key: "call",
      icon: <Phone className="w-4 h-4" />,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Map Directions",
      key: "map",
      icon: <MapPin className="w-4 h-4" />,
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      label: "Instagram Visits",
      key: "instagram",
      icon: <InstagramIcon className="w-4 h-4" />,
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      label: "Page Shares",
      key: "share",
      icon: <Share2 className="w-4 h-4" />,
      color: "bg-stone-50 text-stone-700 border-stone-200",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top metrics bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Total Hub Views
          </span>
          <p className="text-3xl font-black text-stone-800">
            {totalViews.toLocaleString()}
          </p>
          <span className="text-xs text-stone-400">Page visitors</span>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Total Button Clicks
          </span>
          <p className="text-3xl font-black text-stone-800">
            {totalClicks.toLocaleString()}
          </p>
          <span className="text-xs text-stone-400">All customer interactions</span>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Click-Through Rate (CTR)
          </span>
          <p className="text-3xl font-black text-amber-700">{ctr}%</p>
          <span className="text-xs text-stone-400">Clicks per visitor</span>
        </div>
      </div>

      {/* Action Breakdown Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
          <MousePointerClick className="w-5 h-5 text-amber-600" />
          Clicks by Action Channel
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actionItems.map((item) => {
            const count = clicksByEvent[item.key] || 0;
            return (
              <div
                key={item.key}
                className="p-4 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 bg-stone-50/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${item.color}`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-stone-700 truncate">
                    {item.label}
                  </span>
                </div>
                <span className="text-base font-extrabold text-stone-800 shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Usage Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Visitor Devices
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-stone-200 text-center space-y-1 bg-stone-50/50">
            <Smartphone className="w-5 h-5 mx-auto text-stone-500" />
            <p className="text-lg font-black text-stone-800">
              {clicksByDevice["mobile"] || 0}
            </p>
            <span className="text-[11px] text-stone-400 font-semibold uppercase">
              Mobile
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-stone-200 text-center space-y-1 bg-stone-50/50">
            <Tablet className="w-5 h-5 mx-auto text-stone-500" />
            <p className="text-lg font-black text-stone-800">
              {clicksByDevice["tablet"] || 0}
            </p>
            <span className="text-[11px] text-stone-400 font-semibold uppercase">
              Tablet
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-stone-200 text-center space-y-1 bg-stone-50/50">
            <Monitor className="w-5 h-5 mx-auto text-stone-500" />
            <p className="text-lg font-black text-stone-800">
              {clicksByDevice["desktop"] || 0}
            </p>
            <span className="text-[11px] text-stone-400 font-semibold uppercase">
              Desktop
            </span>
          </div>
        </div>
      </div>

      {/* Top 5 Links Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-800">Top 5 Links Summary</h3>
        {topLinks.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {topLinks.map((tl, index) => (
              <div
                key={tl._id}
                className="py-3 flex items-center justify-between gap-4"
              >
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
                  <span className="text-base font-extrabold text-stone-800">
                    {tl.clickCount}
                  </span>
                  <span className="text-[11px] text-stone-400 block">clicks</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400 text-center py-4">
            No link click data yet.
          </p>
        )}
      </div>
    </div>
  );
};
