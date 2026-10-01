import React, { useState } from "react";
import { Palette, Check, Save } from "lucide-react";

import {
  businessHubService,
  type BusinessHubAppearance,
  type BusinessHubProfile,
} from "@/services/businessHub.service";
import { toast } from "@/contexts/toast.context";

interface AdminAppearanceTabProps {
  profile: BusinessHubProfile;
  onAppearanceUpdated: (appearance: BusinessHubAppearance) => void;
}

const THEME_PRESETS: Array<{
  id: BusinessHubAppearance["theme"];
  name: string;
  desc: string;
  bgHex: string;
  accentHex: string;
  cardHex: string;
}> = [
  {
    id: "onebite_premium",
    name: "OneBite Premium",
    desc: "Warm cream, cocoa text & champagne tones (Default)",
    bgHex: "#FDFBF7",
    accentHex: "#3B302B",
    cardHex: "#FFFFFF",
  },
  {
    id: "minimal_cream",
    name: "Minimal Cream",
    desc: "Clean ivory, warm charcoal & amber highlights",
    bgHex: "#FAF7F2",
    accentHex: "#D97706",
    cardHex: "#FFFFFF",
  },
  {
    id: "pistachio_bakery",
    name: "Pistachio Bakery",
    desc: "Soft pistachio green & forest herbal bakes",
    bgHex: "#F3F7F4",
    accentHex: "#2D5A46",
    cardHex: "#FFFFFF",
  },
  {
    id: "chocolate_cream",
    name: "Chocolate & Cream",
    desc: "Deep rich dark cocoa, cream contrast & golden accents",
    bgHex: "#251D18",
    accentHex: "#E0A96D",
    cardHex: "#332822",
  },
];

export const AdminAppearanceTab: React.FC<AdminAppearanceTabProps> = ({
  profile,
  onAppearanceUpdated,
}) => {
  const [appearance, setAppearance] = useState<BusinessHubAppearance>(
    profile.appearance || {
      theme: "onebite_premium",
      buttonStyle: "rounded-xl",
      cardStyle: "elevated",
      borderRadius: "lg",
      profileLayout: "centered",
    },
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await businessHubService.updateAppearance(appearance);
      onAppearanceUpdated(appearance);
      toast.success("Appearance saved", "Hub theme and visual styles updated.");
    } catch (err: unknown) {
      toast.error(
        "Save failed",
        err instanceof Error ? err.message : "Failed to update appearance.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Theme Presets */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-600" />
            Bakery Theme Presets
          </h3>
          <p className="text-xs text-stone-400">
            Select a curated color palette reflecting OneBite Bakery's premium artisan brand.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {THEME_PRESETS.map((t) => {
            const isSelected = appearance.theme === t.id;
            return (
              <div
                key={t.id}
                onClick={() =>
                  setAppearance((prev) => ({ ...prev, theme: t.id }))
                }
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-amber-600 bg-amber-50/20 shadow-sm"
                    : "border-stone-200 hover:border-stone-300 bg-stone-50/50"
                }`}
              >
                {isSelected ? (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : null}

                <div className="space-y-1 pr-6">
                  <h4 className="text-sm font-bold text-stone-800">{t.name}</h4>
                  <p className="text-xs text-stone-500">{t.desc}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <div
                    className="w-6 h-6 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.bgHex }}
                    title="Background"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.accentHex }}
                    title="Accent"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: t.cardHex }}
                    title="Card"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Button & Card Geometry */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Card & Button Geometry</h3>
          <p className="text-xs text-stone-400">
            Control the roundness, elevation, and layout of buttons and containers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              Border Radius / Roundness
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["sm", "md", "lg", "full"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() =>
                    setAppearance((prev) => ({ ...prev, borderRadius: r }))
                  }
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    appearance.borderRadius === r
                      ? "bg-[#3B302B] text-white border-[#3B302B]"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              Card Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["clean", "elevated", "bordered"] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() =>
                    setAppearance((prev) => ({ ...prev, cardStyle: c }))
                  }
                  className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                    appearance.cardStyle === c
                      ? "bg-[#3B302B] text-white border-[#3B302B]"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3B302B] hover:bg-[#2A221E] text-[#FFF8EC] font-bold text-sm shadow-xl transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Theme..." : "Save Appearance Settings"}</span>
        </button>
      </div>
    </form>
  );
};
