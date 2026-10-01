import React, { useState } from "react";
import { Clock, Save } from "lucide-react";

import {
  businessHubService,
  type BusinessDayHours,
  type BusinessHubProfile,
} from "@/services/businessHub.service";
import { toast } from "@/contexts/toast.context";

interface AdminHoursTabProps {
  profile: BusinessHubProfile;
  onHoursUpdated: (hours: BusinessDayHours[]) => void;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const AdminHoursTab: React.FC<AdminHoursTabProps> = ({
  profile,
  onHoursUpdated,
}) => {
  const [hours, setHours] = useState<BusinessDayHours[]>(
    profile.businessHours || [],
  );
  const [saving, setSaving] = useState(false);

  const handleTimeChange = (
    index: number,
    field: "openTime" | "closeTime" | "specialNote",
    value: string,
  ) => {
    const updated = [...hours];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, [field]: value };
    setHours(updated);
  };

  const handleClosedToggle = (index: number) => {
    const updated = [...hours];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, isClosed: !item.isClosed };
    setHours(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await businessHubService.updateBusinessHours(hours);
      onHoursUpdated(hours);
      toast.success("Hours saved", "Weekly bakery schedule updated.");
    } catch (err: unknown) {
      toast.error(
        "Save failed",
        err instanceof Error ? err.message : "Failed to update business hours.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Weekly Store Timetable
          </h3>
          <p className="text-xs text-stone-400">
            Set opening & closing times for each day of the week. Time is evaluated in Asia/Kolkata timezone.
          </p>
        </div>

        <div className="space-y-3">
          {hours.map((h, index) => (
            <div
              key={h.day}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                h.isClosed
                  ? "bg-stone-50 border-stone-200 opacity-70"
                  : "bg-white border-stone-200 hover:border-amber-300"
              }`}
            >
              <div className="w-32 shrink-0">
                <span className="font-bold text-sm text-stone-800 block">
                  {DAY_LABELS[h.day] || h.day}
                </span>
                <label className="inline-flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={h.isClosed}
                    onChange={() => handleClosedToggle(index)}
                    className="w-3.5 h-3.5 rounded-sm text-rose-600 focus:ring-rose-500"
                  />
                  <span>Mark Closed</span>
                </label>
              </div>

              {!h.isClosed ? (
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) =>
                        handleTimeChange(index, "openTime", e.target.value)
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs font-mono"
                    />
                    <span className="text-xs text-stone-400 font-bold">to</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) =>
                        handleTimeChange(index, "closeTime", e.target.value)
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs font-mono"
                    />
                  </div>

                  <input
                    type="text"
                    value={h.specialNote || ""}
                    onChange={(e) =>
                      handleTimeChange(index, "specialNote", e.target.value)
                    }
                    placeholder="Optional note (e.g. Fresh batch at 4PM)"
                    className="flex-1 min-w-[180px] px-3 py-1.5 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
              ) : (
                <div className="flex-1 text-xs text-rose-600 font-semibold italic">
                  Store is closed all day
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3B302B] hover:bg-[#2A221E] text-[#FFF8EC] font-bold text-sm shadow-xl transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Schedule..." : "Save Business Hours"}</span>
        </button>
      </div>
    </form>
  );
};
