import React, { useState } from "react";
import { Save, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";

import {
  businessHubService,
  type BusinessHubProfile,
} from "@/services/businessHub.service";
import { toast } from "@/contexts/toast.context";
import { apiClient } from "@/services/api.client";

interface AdminProfileTabProps {
  initialProfile: BusinessHubProfile;
  onProfileUpdated: (updated: BusinessHubProfile) => void;
}

export const AdminProfileTab: React.FC<AdminProfileTabProps> = ({
  initialProfile,
  onProfileUpdated,
}) => {
  const [formData, setFormData] = useState<BusinessHubProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: keyof BusinessHubProfile) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", "Please select an image smaller than 5MB.");
      return;
    }

    const setLoader = type === "logo" ? setUploadingLogo : setUploadingCover;
    try {
      setLoader(true);
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "business-hub");

      const res = await apiClient.post<{
        success: boolean;
        data: { url?: string; media?: { url: string } };
      }>("/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = res.data?.data?.url || res.data?.data?.media?.url;
      if (uploadedUrl) {
        if (type === "logo") {
          setFormData((prev) => ({ ...prev, logoUrl: uploadedUrl }));
        } else {
          setFormData((prev) => ({ ...prev, coverImageUrl: uploadedUrl }));
        }
        toast.success("Uploaded!", `${type === "logo" ? "Logo" : "Cover"} image uploaded successfully.`);
      }
    } catch {
      toast.error("Upload failed", "Could not upload image. Please try again or provide a direct URL.");
    } finally {
      setLoader(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await businessHubService.updateProfile(formData);
      onProfileUpdated(updated);
      toast.success("Profile saved!", "Business hub profile updated successfully.");
    } catch (err: unknown) {
      toast.error(
        "Save failed",
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Brand Identity Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Brand Identity</h3>
          <p className="text-xs text-stone-400">
            Configure the name, tagline, and badges displayed on the public page.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Business Name *</label>
            <input
              type="text"
              name="businessName"
              required
              value={formData.businessName}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Tagline</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="e.g. Fresh cakes for every special moment."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Founded Year</label>
            <input
              type="text"
              name="foundedYear"
              value={formData.foundedYear}
              onChange={handleChange}
              placeholder="e.g. 2024"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Business Category</label>
            <input
              type="text"
              name="businessCategory"
              value={formData.businessCategory}
              onChange={handleChange}
              placeholder="e.g. Bakery & Confectionery"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>
        </div>

        {/* Verification & Publication toggles */}
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isOfficialVerified}
              onChange={() => handleToggle("isOfficialVerified")}
              className="w-4 h-4 rounded-sm text-[#3B302B] focus:ring-[#3B302B]"
            />
            <span className="text-xs font-bold text-stone-700">
              Display "✓ Official Verified" Badge
            </span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={() => handleToggle("isPublished")}
              className="w-4 h-4 rounded-sm text-[#3B302B] focus:ring-[#3B302B]"
            />
            <span className="text-xs font-bold text-stone-700">
              Public Page Published
            </span>
          </label>
        </div>
      </div>

      {/* Visual Assets (Logo & Cover Banner) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Visual Assets</h3>
          <p className="text-xs text-stone-400">
            Upload or specify URL paths for your bakery logo and optional header cover image.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              Logo (Square format recommended)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl border border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={formData.logoUrl || "/onebite_logo_full.svg"}
                  alt="Logo preview"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  placeholder="/onebite_logo_full.svg or URL"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "logo")}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Cover Banner */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              Cover Image (Optional landscape banner)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-24 h-16 rounded-xl border border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center shrink-0">
                {formData.coverImageUrl ? (
                  <img
                    src={formData.coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-stone-400 font-medium">None</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  name="coverImageUrl"
                  value={formData.coverImageUrl || ""}
                  onChange={handleChange}
                  placeholder="https://... or upload"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingCover ? "Uploading..." : "Upload Cover"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "cover")}
                    className="hidden"
                    disabled={uploadingCover}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Contact & Ordering Channels */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Direct Actions & Contact Numbers</h3>
          <p className="text-xs text-stone-400">
            These values power the prominent top action buttons ("Order Website", "Order WhatsApp", "Call Us").
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Ordering Website URL</label>
            <input
              type="text"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              placeholder="/products or https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Calling Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">WhatsApp Order Number</label>
            <input
              type="text"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+919876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Default WhatsApp Message</label>
            <input
              type="text"
              name="whatsappMessage"
              value={formData.whatsappMessage}
              onChange={handleChange}
              placeholder="Hello OneBite Bakery, I want to place an order."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-stone-700">Contact Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@onebitebakery.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>
        </div>
      </div>

      {/* About Section Text */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800">About Bakery Descriptions</h3>
          <p className="text-xs text-stone-400">
            Tell your customers the story, quality, and passion behind OneBite Bakery.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Short Summary</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="A brief 1-2 sentence overview"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Full Description</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of your recipes, bakery specials, delivery radius..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3B302B]"
            />
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3B302B] hover:bg-[#2A221E] text-[#FFF8EC] font-bold text-sm shadow-xl transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Business Profile"}</span>
        </button>
      </div>
    </form>
  );
};
