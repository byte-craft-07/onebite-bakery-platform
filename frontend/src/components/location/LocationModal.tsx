import React, { useEffect, useState } from "react";
import { MapPin, X, Check, Navigation } from "lucide-react";
import { useAuth } from "@/contexts/auth.context";
import { villageService, type Village } from "@/services/village.service";
import { Button } from "@/components/ui/Button";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { currentLocation, updateCurrentLocation } = useAuth();

  const [districts, setDistricts] = useState<string[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedVillageId, setSelectedVillageId] = useState<string>("");

  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadDistricts = async () => {
      setIsLoadingDistricts(true);
      setErrorMessage(null);
      try {
        const list = await villageService.getDistricts();
        setDistricts(list);
        if (currentLocation?.district && list.includes(currentLocation.district)) {
          setSelectedDistrict(currentLocation.district);
        } else if (list.length > 0) {
          setSelectedDistrict(list[0]);
        }
      } catch (_err) {
        setErrorMessage("Failed to load districts. Please try again.");
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [isOpen, currentLocation]);

  useEffect(() => {
    if (!selectedDistrict) {
      setVillages([]);
      return;
    }

    const loadVillages = async () => {
      setIsLoadingVillages(true);
      try {
        const list = await villageService.getVillages(selectedDistrict);
        setVillages(list);
        if (currentLocation?.villageId && list.some((v) => v.id === currentLocation.villageId)) {
          setSelectedVillageId(currentLocation.villageId);
        } else if (list.length > 0) {
          setSelectedVillageId(list[0].id);
        } else {
          setSelectedVillageId("");
        }
      } catch (_err) {
        setVillages([]);
      } finally {
        setIsLoadingVillages(false);
      }
    };

    loadVillages();
  }, [selectedDistrict, currentLocation]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict || !selectedVillageId) {
      setErrorMessage("Please select both a District and a Village / Service Area.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updateCurrentLocation(selectedVillageId, selectedDistrict);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Failed to update location. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#FFF8EC] rounded-2xl sm:rounded-3xl shadow-xl border border-[#E5DEC9] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E5DEC9] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 text-[#3B302B]">
            <MapPin className="h-5 w-5 text-[#596B58]" />
            <h2 className="text-base sm:text-lg font-bold">Select Delivery Location</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-[#3B302B] hover:bg-[#F7F2E7] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {currentLocation ? (
            <div className="p-3.5 bg-white border border-[#E5DEC9] rounded-xl flex items-center gap-3">
              <Navigation className="h-5 w-5 text-[#596B58] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#7A6E65]">Current Active Location: </span>
                <strong className="text-[#3B302B]">
                  {currentLocation.villageName}, {currentLocation.district} ({currentLocation.pincode})
                </strong>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-white border border-[#596B58]/40 rounded-xl flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#596B58] shrink-0 animate-bounce" />
              <div className="text-xs text-[#3B302B]">
                <strong className="block text-[#596B58] font-extrabold mb-0.5">Selection Required</strong>
                Please select your <strong>District</strong> and <strong>Village / Service Area</strong> to view products and prices for your local branch.
              </div>
            </div>
          )}

          {errorMessage ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
              {errorMessage}
            </div>
          ) : null}

          {/* District Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3B302B]">
              1. Select District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={isLoadingDistricts}
              className="w-full h-11 px-3.5 rounded-xl border border-[#E5DEC9] bg-white text-xs font-medium text-[#3B302B] focus:outline-none focus:border-[#596B58] transition-colors cursor-pointer"
            >
              {isLoadingDistricts ? (
                <option value="">Loading districts...</option>
              ) : (
                districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Village Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3B302B]">
              2. Select Village / Service Area
            </label>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              disabled={isLoadingVillages || !selectedDistrict}
              className="w-full h-11 px-3.5 rounded-xl border border-[#E5DEC9] bg-white text-xs font-medium text-[#3B302B] focus:outline-none focus:border-[#596B58] transition-colors cursor-pointer"
            >
              {isLoadingVillages ? (
                <option value="">Loading villages...</option>
              ) : villages.length === 0 ? (
                <option value="">No active villages in this district</option>
              ) : (
                villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.pincode})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!selectedVillageId || isLoadingVillages}
              className="text-xs flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Confirm Location</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
