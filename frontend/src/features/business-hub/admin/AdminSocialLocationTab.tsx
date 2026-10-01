import React, { useState } from "react";
import { MapPin, Share2, Save, ExternalLink } from "lucide-react";

import {
  businessHubService,
  type BusinessHubAddress,
  type BusinessHubCoordinates,
  type BusinessHubProfile,
  type BusinessHubSocial,
} from "@/services/businessHub.service";
import { toast } from "@/contexts/toast.context";

interface AdminSocialLocationTabProps {
  profile: BusinessHubProfile;
  onProfileUpdated: (profile: BusinessHubProfile) => void;
}

export const AdminSocialLocationTab: React.FC<AdminSocialLocationTabProps> = ({
  profile,
  onProfileUpdated,
}) => {
  const [social, setSocial] = useState<BusinessHubSocial>(profile.social || {});
  const [address, setAddress] = useState<BusinessHubAddress>(
    profile.address || {
      fullAddress: "",
      village: "",
      district: "",
      state: "",
      pincode: "",
    },
  );
  const [mapUrl, setMapUrl] = useState<string>(profile.mapUrl || "");
  const [coordinates, setCoordinates] = useState<BusinessHubCoordinates>(
    profile.coordinates || { latitude: 26.5393, longitude: 80.4878 },
  );

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await Promise.all([
        businessHubService.updateSocial(social),
        businessHubService.updateLocation({ address, mapUrl, coordinates }),
      ]);

      const updated = {
        ...profile,
        social,
        address,
        mapUrl,
        coordinates,
      };
      onProfileUpdated(updated);
      toast.success("Saved!", "Social channels and location details updated.");
    } catch (err: unknown) {
      toast.error(
        "Save failed",
        err instanceof Error ? err.message : "Failed to update details.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Social Media Channels */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-600" />
            Social Media Channels
          </h3>
          <p className="text-xs text-stone-400">
            Provide direct profile URLs. Only platforms with URLs filled in will appear on the public page.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Instagram Profile URL</label>
            <input
              type="text"
              value={social.instagram || ""}
              onChange={(e) =>
                setSocial((prev) => ({ ...prev, instagram: e.target.value }))
              }
              placeholder="https://instagram.com/onebitebakery"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Facebook Page URL</label>
            <input
              type="text"
              value={social.facebook || ""}
              onChange={(e) =>
                setSocial((prev) => ({ ...prev, facebook: e.target.value }))
              }
              placeholder="https://facebook.com/onebitebakery"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">YouTube Channel URL</label>
            <input
              type="text"
              value={social.youtube || ""}
              onChange={(e) =>
                setSocial((prev) => ({ ...prev, youtube: e.target.value }))
              }
              placeholder="https://youtube.com/@onebitebakery"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">WhatsApp Link</label>
            <input
              type="text"
              value={social.whatsapp || ""}
              onChange={(e) =>
                setSocial((prev) => ({ ...prev, whatsapp: e.target.value }))
              }
              placeholder="https://wa.me/919876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>
        </div>
      </div>

      {/* Physical Location & Google Maps */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-600" />
            Physical Address & Google Maps
          </h3>
          <p className="text-xs text-stone-400">
            Enter your storefront address and the Google Maps destination URL.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Full Store Address *</label>
            <input
              type="text"
              required
              value={address.fullAddress}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, fullAddress: e.target.value }))
              }
              placeholder="e.g. OneBite Bakery, Main Market Road"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Village / Area</label>
              <input
                type="text"
                value={address.village}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, village: e.target.value }))
                }
                placeholder="Terha"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">District</label>
              <input
                type="text"
                value={address.district}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, district: e.target.value }))
                }
                placeholder="Unnao"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">State</label>
              <input
                type="text"
                value={address.state}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, state: e.target.value }))
                }
                placeholder="Uttar Pradesh"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Pincode</label>
              <input
                type="text"
                value={address.pincode}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, pincode: e.target.value }))
                }
                placeholder="209801"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">
                Google Maps Destination URL
              </label>
              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Test Destination</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
            </div>
            <input
              type="text"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Latitude (Optional)</label>
              <input
                type="number"
                step="any"
                value={coordinates.latitude}
                onChange={(e) =>
                  setCoordinates((prev) => ({
                    ...prev,
                    latitude: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Longitude (Optional)</label>
              <input
                type="number"
                step="any"
                value={coordinates.longitude}
                onChange={(e) =>
                  setCoordinates((prev) => ({
                    ...prev,
                    longitude: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono"
              />
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
          <span>{saving ? "Saving Details..." : "Save Social & Location"}</span>
        </button>
      </div>
    </form>
  );
};
